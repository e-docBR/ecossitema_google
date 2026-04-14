/**
 * PEDAGOGO.AI — Segurança, LGPD e Diagnóstico (Bloco 8)
 * Arquivo: 12_Seguranca.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Controle de acesso por papel, trilha de auditoria, backup automático
 * e diagnóstico semanal do sistema.
 *
 * Referência: Bloco 8.1, 8.3 do prompt mestre
 */

// ============================================================
// CONTROLE DE ACESSO
// ============================================================

/**
 * Verifica se o usuário ativo tem o papel necessário para executar a ação.
 * Deve ser chamado antes de qualquer acesso a dados sensíveis ou restritos.
 *
 * @param {string} papelRequerido - Ex: PAPEIS.COORDENADOR, PAPEIS.PROFESSOR
 * @throws {Error} Se o usuário não tiver autorização
 */
function verificarPermissao(papelRequerido) {
  const email = getUsuarioAtivo();
  const props = PropertiesService.getScriptProperties();

  // Hierarquia: ADMIN > GESTOR > COORDENADOR > PROFESSOR
  const hierarquia = [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN];
  const nivelRequerido = hierarquia.indexOf(papelRequerido);

  // Verificar cada papel a partir do requerido
  for (let i = nivelRequerido; i < hierarquia.length; i++) {
    const papel = hierarquia[i];
    const emailsAutorizados = (props.getProperty(`EMAILS_${papel.toUpperCase()}`) || '').split(',');
    if (emailsAutorizados.some(e => e.trim().toLowerCase() === email.toLowerCase())) {
      return;  // Autorizado
    }
  }

  // Proprietário do script tem acesso total
  try {
    if (Session.getActiveUser().getEmail() === DriveApp.getRootFolder().getOwner().getEmail()) {
      return;
    }
  } catch(e) {}

  registrarLog('ALERTA', `Acesso negado para ${email}`, `Papel requerido: ${papelRequerido}`);
  throw new Error(
    `Acesso não autorizado. Esta ação requer o papel: ${papelRequerido}.\n` +
    `Contate o administrador do sistema para solicitar permissão.`
  );
}

/**
 * Registra uma ação na trilha de auditoria (LGPD Art. 37).
 * Chamado sempre que dados pessoais são lidos, escritos ou exportados.
 *
 * @param {string} acao    - 'LEITURA' | 'ESCRITA' | 'EXPORTACAO' | 'EXCLUSAO'
 * @param {string} recurso - Ex: 'TURMAS_ALUNOS.Tipo_NEE'
 * @param {string} [contexto] - Informação adicional
 */
function registrarAuditoria(acao, recurso, contexto) {
  const email = getUsuarioAtivo();
  registrarLog(
    'AUDITORIA',
    `[${acao}] Recurso: ${recurso} | Usuário: ${email}`,
    contexto || ''
  );
}

/**
 * Classifica um campo conforme a LGPD (Bloco 8.1).
 * @param {string} nomeCampo - Nome da coluna/campo
 * @returns {string} 'PUBLICO' | 'RESTRITO' | 'SENSIVEL'
 */
function classificarDado(nomeCampo) {
  const config = getConfig();
  const campo = nomeCampo.toLowerCase();

  const sensiveis = config.LGPD.COLUNAS_SENSIVEIS.map(c => c.toLowerCase());
  const restritos = config.LGPD.COLUNAS_RESTRITAS.map(c => c.toLowerCase());

  if (sensiveis.some(s => campo.includes(s))) return config.LGPD.SENSIVEL;
  if (restritos.some(r => campo.includes(r))) return config.LGPD.RESTRITO;
  return config.LGPD.PUBLICO;
}

// ============================================================
// BACKUP AUTOMÁTICO
// ============================================================

/**
 * Executa o backup semanal das planilhas-mestre.
 * Chamado pelo trigger time-based instalado em instalarTriggers().
 */
function executarBackupSemanal() {
  registrarLog('INFO', 'Iniciando backup semanal automático');
  try {
    criarBackupSemanal();
    registrarLog('INFO', 'Backup semanal concluído com sucesso');
  } catch (e) {
    registrarLog('ERRO', 'Falha no backup semanal: ' + e.message);
    const config = getConfig();
    enviarEmailAlerta(
      config.EMAIL.COORDENACAO,
      'Falha no Backup Semanal do PEDAGOGO.AI',
      `<p>O backup semanal automático falhou em ${dataHoje()}.</p>
       <p>Erro: ${e.message}</p>
       <p>Verifique o log do sistema e execute o backup manualmente.</p>`
    );
  }
}

/**
 * Desativa um Google Form após uma data limite.
 * Usado para provas: impede submissões após o prazo.
 *
 * @param {string} formId        - ID do formulário
 * @param {string} dataLimite    - Data limite no formato dd/MM/yyyy
 */
function desativarFormularioAposData(formId, dataLimite) {
  try {
    const form = FormApp.openById(formId);
    const hoje = new Date();
    const partes = dataLimite.split('/');
    const limite = new Date(partes[2], partes[1] - 1, partes[0]);

    if (hoje > limite) {
      form.setAcceptingResponses(false);
      registrarLog('INFO', `Formulário desativado após prazo: ${formId}`, dataLimite);
    }
  } catch (e) {
    registrarLog('ERRO', `Falha ao desativar formulário ${formId}: ${e.message}`);
  }
}

// ============================================================
// DIAGNÓSTICO DO SISTEMA (Bloco 8.3)
// ============================================================

/**
 * Executa verificação completa da saúde do sistema.
 * Retorna checklist técnico e pedagógico com semáforo por item.
 *
 * @returns {Object} Relatório de saúde com status por componente
 */
function diagnosticarSistema() {
  const config = getConfig();
  const relatorio = {
    data:        dataHoje(),
    tecnico:     {},
    pedagogico:  {},
    resumo:      { ok: 0, atencao: 0, critico: 0 }
  };

  // ── CHECKLIST TÉCNICO ──────────────────────────────────────

  // 1. API Gemini
  relatorio.tecnico.geminiAPI = _verificarGemini();

  // 2. Planilhas-mestre
  ['MASTER_BNCC', 'BANCO_QUESTOES', 'TURMAS_ALUNOS', 'RESULTADOS'].forEach(nome => {
    const id = config.SHEETS[nome];
    relatorio.tecnico[`planilha_${nome}`] = _verificarPlanilha(nome, id);
  });

  // 3. Pastas no Drive
  ['ROOT', 'PLANEJAMENTO', 'AVALIACAO', 'CONFIGURACOES'].forEach(nome => {
    const id = config.DRIVE[nome];
    relatorio.tecnico[`pasta_${nome}`] = _verificarPasta(nome, id);
  });

  // 4. Backup recente (últimos 8 dias)
  const ultimoBackup = PropertiesService.getScriptProperties().getProperty('ULTIMO_BACKUP');
  relatorio.tecnico.backup = _verificarBackup(ultimoBackup);

  // ── CHECKLIST PEDAGÓGICO ──────────────────────────────────

  // 5. Questões no banco
  relatorio.pedagogico.bancoQuestoes = _verificarBancoQuestoes();

  // 6. Turmas cadastradas
  relatorio.pedagogico.turmasCadastradas = _verificarTurmas();

  // 7. Alunos com NEE
  relatorio.pedagogico.alunosNEE = _verificarNEE();

  // ── CONTAGEM DO RESUMO ────────────────────────────────────
  [...Object.values(relatorio.tecnico), ...Object.values(relatorio.pedagogico)]
    .forEach(item => {
      if (item.status === 'OK')      relatorio.resumo.ok++;
      if (item.status === 'ATENCAO') relatorio.resumo.atencao++;
      if (item.status === 'CRITICO') relatorio.resumo.critico++;
    });

  // Logar e enviar por e-mail se houver críticos
  const statusGeral = relatorio.resumo.critico > 0 ? '🔴 CRÍTICO' :
                      relatorio.resumo.atencao > 0 ? '🟡 ATENÇÃO' : '🟢 OK';

  registrarLog('INFO', `Diagnóstico do sistema: ${statusGeral}`,
    `OK: ${relatorio.resumo.ok} | Atenção: ${relatorio.resumo.atencao} | Crítico: ${relatorio.resumo.critico}`
  );

  if (relatorio.resumo.critico > 0) {
    _enviarRelatorioDiagnostico(relatorio);
  }

  return relatorio;
}

function _verificarGemini() {
  try {
    getGeminiKey();
    return { status: 'OK', mensagem: 'Chave configurada' };
  } catch (e) {
    return { status: 'CRITICO', mensagem: 'Chave GEMINI_KEY não configurada' };
  }
}

function _verificarPlanilha(nome, id) {
  if (!id) return { status: 'CRITICO', mensagem: `${nome} não configurada` };
  try {
    const ss = SpreadsheetApp.openById(id);
    return { status: 'OK', mensagem: `Acessível: ${ss.getName()}` };
  } catch (e) {
    return { status: 'CRITICO', mensagem: `${nome} inacessível: ${e.message}` };
  }
}

function _verificarPasta(nome, id) {
  if (!id) return { status: 'CRITICO', mensagem: `Pasta ${nome} não configurada` };
  try {
    DriveApp.getFolderById(id);
    return { status: 'OK', mensagem: `Pasta ${nome} acessível` };
  } catch (e) {
    return { status: 'CRITICO', mensagem: `Pasta ${nome} inacessível` };
  }
}

function _verificarBackup(ultimoBackup) {
  if (!ultimoBackup) {
    return { status: 'ATENCAO', mensagem: 'Nenhum backup registrado' };
  }
  const partes = ultimoBackup.split(' ')[0].split('/');
  const dataBackup = new Date(partes[2], partes[1] - 1, partes[0]);
  const diasSemBackup = Math.floor((new Date() - dataBackup) / 86400000);

  if (diasSemBackup <= 8) return { status: 'OK', mensagem: `Último backup: ${ultimoBackup}` };
  if (diasSemBackup <= 15) return { status: 'ATENCAO', mensagem: `Backup há ${diasSemBackup} dias` };
  return { status: 'CRITICO', mensagem: `Backup há ${diasSemBackup} dias — Execute o backup imediatamente` };
}

function _verificarBancoQuestoes() {
  try {
    const config = getConfig();
    if (!config.SHEETS.BANCO_QUESTOES) return { status: 'CRITICO', mensagem: 'Planilha não configurada' };
    const dados = lerAba(config.SHEETS.BANCO_QUESTOES, 'Questões');
    const totalQuestoes = dados.length - 1;
    if (totalQuestoes === 0) return { status: 'ATENCAO', mensagem: 'Banco vazio — adicione questões' };
    return { status: 'OK', mensagem: `${totalQuestoes} questões cadastradas` };
  } catch (e) {
    return { status: 'CRITICO', mensagem: 'Erro ao acessar banco: ' + e.message };
  }
}

function _verificarTurmas() {
  try {
    const config = getConfig();
    if (!config.SHEETS.TURMAS_ALUNOS) return { status: 'CRITICO', mensagem: 'Planilha não configurada' };
    const dados = lerAba(config.SHEETS.TURMAS_ALUNOS, 'Turmas');
    const turmasAtivas = dados.slice(1).filter(t => String(t[7]) === 'TRUE' || String(t[7]).toLowerCase() === 'true').length;
    if (turmasAtivas === 0) return { status: 'ATENCAO', mensagem: 'Nenhuma turma ativa cadastrada' };
    return { status: 'OK', mensagem: `${turmasAtivas} turmas ativas` };
  } catch (e) {
    return { status: 'ATENCAO', mensagem: 'Erro ao verificar turmas: ' + e.message };
  }
}

function _verificarNEE() {
  try {
    const config = getConfig();
    if (!config.SHEETS.TURMAS_ALUNOS) return { status: 'CRITICO', mensagem: 'Planilha não configurada' };
    const dados = lerAba(config.SHEETS.TURMAS_ALUNOS, 'Matrículas');
    const alunosNEE = dados.slice(1).filter(a =>
      String(a[9]).toLowerCase() === 'sim' && String(a[12]).toLowerCase() !== 'sim'
    );
    if (alunosNEE.length > 0) {
      return { status: 'ATENCAO', mensagem: `${alunosNEE.length} alunos com NEE sem PEI gerado` };
    }
    return { status: 'OK', mensagem: 'Todos os alunos NEE com PEI gerado' };
  } catch (e) {
    return { status: 'ATENCAO', mensagem: 'Erro ao verificar NEE: ' + e.message };
  }
}

function _enviarRelatorioDiagnostico(relatorio) {
  const config = getConfig();
  let corpo = `<h3>Diagnóstico do Sistema — ${relatorio.data}</h3>
    <p>O sistema PEDAGOGO.AI identificou itens críticos que requerem atenção imediata:</p>
    <h4>Checklist Técnico:</h4><ul>`;

  Object.entries(relatorio.tecnico).forEach(([chave, item]) => {
    corpo += `<li>${semaforoEmoji(item.status)} <strong>${chave}</strong>: ${item.mensagem}</li>`;
  });

  corpo += '</ul><h4>Checklist Pedagógico:</h4><ul>';
  Object.entries(relatorio.pedagogico).forEach(([chave, item]) => {
    corpo += `<li>${semaforoEmoji(item.status)} <strong>${chave}</strong>: ${item.mensagem}</li>`;
  });
  corpo += '</ul>';

  enviarEmailAlerta(
    [config.EMAIL.COORDENACAO, config.EMAIL.DIRECAO].filter(e => e),
    `⚠️ Diagnóstico do Sistema — ${relatorio.resumo.critico} itens críticos`,
    corpo
  );
}
