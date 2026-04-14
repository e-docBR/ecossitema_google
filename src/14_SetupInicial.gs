/**
 * PEDAGOGO.AI — Setup Inicial do Sistema
 * Arquivo: 14_SetupInicial.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Wizard de primeiro uso: cria estrutura de pastas no Drive,
 * planilhas-mestre e aplica proteções LGPD.
 * IDEMPOTENTE: pode ser executado múltiplas vezes sem efeitos colaterais.
 *
 * COMO USAR:
 * 1. Configure GEMINI_KEY em Apps Script > Propriedades de script
 * 2. Execute executarSetupCompleto() como função de início
 *
 * Referência: Bloco 8.2 (roteiro de implantação) do prompt mestre
 */

// ============================================================
// ORQUESTRADOR PRINCIPAL
// ============================================================

/**
 * Executa o setup completo do sistema PEDAGOGO.AI.
 * Deve ser chamado UMA VEZ pelo administrador do sistema.
 * Mostra progresso via UI e registra cada etapa no log.
 */
function executarSetupCompleto() {
  // Detectar contexto UI com segurança (standalone não tem getUi)
  let ui = null;
  try { ui = SpreadsheetApp.getUi(); } catch(e) {}
  try { if (!ui) ui = DocumentApp.getUi(); } catch(e) {}

  // Se tiver UI disponível, abre o wizard visual
  if (ui) {
    try {
      abrirSetupWizard();
      return;
    } catch (e) {
      // Fallback para o setup texto se o wizard falhar por algum motivo
      registrarLog('ALERTA', 'Wizard HTML falhou, executando setup em modo texto: ' + e.message);
    }
  }

  try {
    _mostrarProgresso(ui, 'Iniciando setup do PEDAGOGO.AI...');

    // Etapa 1: Verificar pré-requisitos
    _mostrarProgresso(ui, '🔍 Verificando pré-requisitos...');
    verificarPreRequisitos();

    // Etapa 2: Criar estrutura de pastas no Drive
    _mostrarProgresso(ui, '📁 Criando estrutura de pastas no Google Drive...');
    const pastas = criarEstruturaPastas();
    registrarLog('INFO', 'Estrutura de pastas criada', JSON.stringify(pastas));

    // Etapa 3: Criar planilhas-mestre
    _mostrarProgresso(ui, '📊 Criando planilhas-mestre...');
    const planilhas = criarPlanilhasMestre();

    // Etapa 4: Configurar proteções LGPD
    _mostrarProgresso(ui, '🔒 Aplicando proteções LGPD...');
    configurarProtecoesLGPD(planilhas.TURMAS_ALUNOS);

    // Etapa 5: Instalar triggers
    _mostrarProgresso(ui, '⚡ Instalando triggers automáticos...');
    try { instalarTriggers(); } catch(e) {
      registrarLog('ALERTA', 'Triggers não instalados (execute instalarTriggers() manualmente): ' + e.message);
    }

    // Etapa 6: Criar formulários (Bloco 2.3, 8.2 etapa 6)
    _mostrarProgresso(ui, '📝 Criando formulários do sistema...');
    const formularios = {};
    try {
      formularios.planoDeAula = criarFormPlanoDeAula();
      registrarLog('INFO', 'Formulário de Plano de Aula criado', formularios.planoDeAula);
    } catch(e) {
      registrarLog('ALERTA', 'Formulário de Plano de Aula não criado: ' + e.message);
    }

    // Etapa 7: Registrar data de instalação
    salvarPropriedade('DATA_INSTALACAO', formatarData(new Date(), 'dd/MM/yyyy HH:mm:ss'));
    salvarPropriedade('VERSAO_SISTEMA', '1.0');

    const urlFormPlano = formularios.planoDeAula || '(não criado — execute criarFormPlanoDeAula() manualmente)';

    const mensagemFinal = `✅ PEDAGOGO.AI instalado com sucesso!\n\n` +
      `📁 Pastas criadas no Drive: PEDAGOGO.AI/\n` +
      `📊 Planilhas criadas: MASTER_BNCC, BANCO_QUESTOES, TURMAS_ALUNOS, RESULTADOS\n` +
      `📝 Formulário de Plano de Aula: ${urlFormPlano}\n\n` +
      `PRÓXIMOS PASSOS:\n` +
      `1. Importe o catálogo BNCC na aba 'Habilidades' do MASTER_BNCC\n` +
      `2. Cadastre as turmas e alunos na planilha TURMAS_ALUNOS\n` +
      `3. Configure os e-mails em Propriedades de script:\n` +
      `   EMAIL_COORDENACAO, EMAIL_DIRECAO\n` +
      `4. Realize o teste piloto: gere 1 plano de aula\n` +
      `5. Para provas digitais: use criarProvaDigital() após gerar uma prova\n\n` +
      `Veja o SETUP_GUIDE.md para instruções detalhadas.`;

    registrarLog('INFO', 'Setup concluído com sucesso');

    if (ui) {
      ui.alert('PEDAGOGO.AI — Setup Concluído', mensagemFinal, ui.ButtonSet.OK);
    }

    return { sucesso: true, mensagem: mensagemFinal };

  } catch (e) {
    registrarLog('ERRO', 'Falha no setup: ' + e.message, e.stack);
    if (ui) {
      ui.alert(
        'Erro no Setup',
        `Ocorreu um erro durante a instalação:\n\n${e.message}\n\n` +
        `Verifique o log do sistema e tente novamente.`,
        ui.ButtonSet.OK
      );
    }
    throw e;
  }
}

// ============================================================
// VERIFICAÇÃO DE PRÉ-REQUISITOS
// ============================================================

/**
 * Verifica se todos os pré-requisitos estão configurados.
 * @throws {Error} Se algum pré-requisito estiver faltando
 */
function verificarPreRequisitos() {
  // GEMINI_KEY é necessária apenas para as ferramentas de IA,
  // NÃO para criar pastas e planilhas. Ela pode ser configurada depois.
  let geminiOk = false;
  try {
    getGeminiKey();
    geminiOk = true;
  } catch (e) {
    // Não bloquear — apenas registrar aviso
    registrarLog(
      'ALERTA',
      'GEMINI_KEY não configurada. Configure em: menu → 🔧 Configurar antes de usar as ferramentas de IA.'
    );
  }

  registrarLog('INFO', `Pré-requisitos verificados — GEMINI_KEY: ${geminiOk ? 'OK' : 'PENDENTE (configurar depois)'}`);
  return { geminiOk: geminiOk };
}

// ============================================================
// CRIAÇÃO DE PLANILHAS-MESTRE
// ============================================================

/**
 * Cria ou abre as 4 planilhas-mestre e configura seus cabeçalhos.
 * @returns {Object} Mapa nome → ID das planilhas
 */
function criarPlanilhasMestre() {
  const config = getConfig();
  const idConfigPasta = config.DRIVE.CONFIGURACOES;
  if (!idConfigPasta) {
    throw new Error('Estrutura de pastas não encontrada. Execute a criação de pastas primeiro.');
  }

  const pastaConfig = DriveApp.getFolderById(idConfigPasta);
  const planilhas = {};
  const nomesEChaves = [
    { nome: 'MASTER_BNCC',    chave: 'ID_SHEET_MASTER_BNCC'    },
    { nome: 'BANCO_QUESTOES', chave: 'ID_SHEET_BANCO_QUESTOES'  },
    { nome: 'TURMAS_ALUNOS',  chave: 'ID_SHEET_TURMAS_ALUNOS'  },
    { nome: 'RESULTADOS',     chave: 'ID_SHEET_RESULTADOS'      }
  ];

  nomesEChaves.forEach(({ nome, chave }) => {
    // Verificar se já existe
    const idExistente = PropertiesService.getScriptProperties().getProperty(chave);
    let ss;

    if (idExistente) {
      try {
        ss = SpreadsheetApp.openById(idExistente);
        registrarLog('INFO', `Planilha ${nome} já existe — usando existente`);
      } catch (e) {
        // Planilha não existe mais — recriar
        ss = null;
      }
    }

    if (!ss) {
      ss = SpreadsheetApp.create(`PEDAGOGO_AI_${nome}`);
      // Mover para pasta de configurações
      const arquivo = DriveApp.getFileById(ss.getId());
      pastaConfig.addFile(arquivo);
      DriveApp.getRootFolder().removeFile(arquivo);
      salvarPropriedade(chave, ss.getId());
      registrarLog('INFO', `Planilha ${nome} criada`, ss.getId());
    }

    // Criar cabeçalhos
    criarCabecalhosPlanilha(ss.getId(), nome);
    planilhas[nome] = ss.getId();
  });

  return planilhas;
}

// ============================================================
// PROTEÇÕES LGPD
// ============================================================

/**
 * Configura proteção de células nas colunas sensíveis de TURMAS_ALUNOS.
 * Colunas sensíveis só são editáveis pelo coordenador/direção.
 *
 * @param {string} idTurmasAlunos - ID da planilha TURMAS_ALUNOS
 */
function configurarProtecoesLGPD(idTurmasAlunos) {
  if (!idTurmasAlunos) {
    registrarLog('ALERTA', 'ID da planilha TURMAS_ALUNOS não fornecido — proteções LGPD não aplicadas');
    return;
  }

  const config = getConfig();
  const emailCoordenacao = config.EMAIL.COORDENACAO;
  const emailDirecao = config.EMAIL.DIRECAO;
  const editoresSensiveis = [emailCoordenacao, emailDirecao].filter(e => e);

  // Colunas sensíveis na aba Matrículas (índices base 0, conforme schema):
  // 10: Tipo_NEE, 11: Laudo_Medico, 12: Requer_PEI, 13: Observacoes_Pedagogicas
  // 14: Status (restrito ao secretário/gestor)
  // 15-18: campos EJA (contexto adulto — restrito ao professor/coordenador)
  const colunasSensiveis = [10, 11, 12];  // Tipo_NEE, Laudo_Medico, Requer_PEI
  const colunasRestritas = [7, 8];         // Contato_WhatsApp, Email_Responsavel

  protegerColunas(idTurmasAlunos, 'Matrículas', colunasSensiveis, editoresSensiveis);
  protegerColunas(idTurmasAlunos, 'Matrículas', colunasRestritas, editoresSensiveis);

  registrarLog('INFO', 'Proteções LGPD configuradas em TURMAS_ALUNOS');
}

// ============================================================
// UTILIDADES DE SETUP
// ============================================================

/**
 * Verifica o status atual da instalação.
 * @returns {Object} Status de cada componente do setup
 */
function verificarStatusInstalacao() {
  const config = getConfig();
  const status = {};

  // Verificar planilhas
  ['MASTER_BNCC', 'BANCO_QUESTOES', 'TURMAS_ALUNOS', 'RESULTADOS'].forEach(nome => {
    const id = config.SHEETS[nome];
    if (!id) {
      status[nome] = { ok: false, mensagem: 'Planilha não configurada' };
      return;
    }
    try {
      SpreadsheetApp.openById(id);
      status[nome] = { ok: true, id };
    } catch (e) {
      status[nome] = { ok: false, mensagem: 'Planilha não acessível: ' + e.message };
    }
  });

  // Verificar pastas
  ['ROOT', 'PLANEJAMENTO', 'AVALIACAO', 'RESULTADOS', 'ALUNOS', 'CONFIGURACOES'].forEach(nome => {
    const id = config.DRIVE[nome];
    if (!id) {
      status[`PASTA_${nome}`] = { ok: false, mensagem: 'Pasta não configurada' };
      return;
    }
    try {
      DriveApp.getFolderById(id);
      status[`PASTA_${nome}`] = { ok: true, id };
    } catch (e) {
      status[`PASTA_${nome}`] = { ok: false, mensagem: 'Pasta não acessível' };
    }
  });

  // Verificar chave Gemini
  try {
    getGeminiKey();
    status['GEMINI_KEY'] = { ok: true };
  } catch (e) {
    status['GEMINI_KEY'] = { ok: false, mensagem: 'Chave não configurada' };
  }

  return status;
}

/**
 * Mostra mensagem de progresso via UI ou log.
 * @param {Object} ui - Objeto UI do Apps Script (pode ser null)
 * @param {string} mensagem - Mensagem a exibir
 */
function _mostrarProgresso(ui, mensagem) {
  registrarLog('INFO', mensagem);
  // Em versões futuras, usar HtmlService para modal de progresso
  console.log(mensagem);
}

/**
 * Reseta COMPLETAMENTE as propriedades do sistema (usar com cuidado!).
 * Deve ser confirmado explicitamente pelo administrador.
 *
 * @param {string} confirmacao - Deve ser 'CONFIRMAR_RESET_COMPLETO' para executar
 */
function resetarSistema(confirmacao) {
  if (confirmacao !== 'CONFIRMAR_RESET_COMPLETO') {
    throw new Error(
      'Para resetar o sistema, passe a string "CONFIRMAR_RESET_COMPLETO" como argumento. ' +
      'ATENÇÃO: Esta ação não pode ser desfeita.'
    );
  }
  PropertiesService.getScriptProperties().deleteAllProperties();
  registrarLog('ALERTA', 'SISTEMA RESETADO: todas as propriedades foram apagadas');
}

// ============================================================
// PLANILHA HOST — vínculo entre script standalone e o menu
// ============================================================

/**
 * Cria (ou reabre) a planilha host do PEDAGOGO.AI e instala o trigger onOpen.
 *
 * COMO USAR (primeira vez):
 *  1. Abra script.google.com → selecione o projeto PEDAGOGO.AI
 *  2. No seletor de função (dropdown), escolha "criarPlanilhaHost"
 *  3. Clique em ▶ Executar
 *  4. Autorize as permissões quando solicitado
 *  5. Copie a URL do log de execução e abra no navegador
 *  6. O menu 🤖 PEDAGOGO.AI aparecerá automaticamente
 *
 * Idempotente: se a planilha já existir (ID_SHEET_HOST), apenas
 * garante que o trigger onOpen está instalado e retorna a URL.
 *
 * @returns {string} URL da planilha host
 */
function criarPlanilhaHost() {
  const props = PropertiesService.getScriptProperties();
  let ss;

  // Verificar se já existe
  const idExistente = props.getProperty('ID_SHEET_HOST');
  if (idExistente) {
    try {
      ss = SpreadsheetApp.openById(idExistente);
      console.log('Planilha host já existe — reutilizando: ' + ss.getUrl());
    } catch (e) {
      ss = null; // foi deletada, recriar
    }
  }

  // Criar nova planilha
  if (!ss) {
    ss = SpreadsheetApp.create('PEDAGOGO.AI — Painel Principal');
    props.setProperty('ID_SHEET_HOST', ss.getId());
    _configurarLayoutPlanilhaHost(ss);
    registrarLog('INFO', 'Planilha host criada', ss.getUrl());
  }

  // Garantir trigger onOpen (idempotente)
  instalarTriggerOnOpen(ss.getId());

  const url = ss.getUrl();
  console.log('════════════════════════════════════════');
  console.log('✅ PEDAGOGO.AI — Planilha host pronta!');
  console.log('🔗 Acesse: ' + url);
  console.log('Próximos passos:');
  console.log('  1. Abra o link acima');
  console.log('  2. No menu "🤖 PEDAGOGO.AI" → "📌 Abrir Painel"');
  console.log('  3. Na sidebar → Configurar → insira a GEMINI_KEY');
  console.log('  4. Execute o Setup Inicial');
  console.log('════════════════════════════════════════');

  return url;
}

/**
 * Configura o layout inicial da planilha host (abas, cabeçalho, instruções).
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - Planilha recém-criada
 */
function _configurarLayoutPlanilhaHost(ss) {
  const aba = ss.getActiveSheet();
  aba.setName('PEDAGOGO.AI');

  // Cabeçalho
  aba.getRange('A1').setValue('🤖 PEDAGOGO.AI').setFontSize(20).setFontWeight('bold')
    .setFontColor('#1a73e8');
  aba.getRange('A2').setValue('Sistema de Automação Pedagógica — Colégio Municipal de Itabatan | SEME/Mucuri-BA')
    .setFontColor('#5f6368').setFontStyle('italic');

  // Separador
  aba.getRange('A3').setValue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━').setFontColor('#dadce0');

  // Instruções de uso
  const instrucoes = [
    ['', ''],
    ['COMO USAR O PEDAGOGO.AI', ''],
    ['1.', 'Clique no menu  🤖 PEDAGOGO.AI  → 📌 Abrir Painel PEDAGOGO.AI'],
    ['2.', 'Na sidebar, clique em 🔧 Configurar para inserir a chave Gemini e e-mails'],
    ['3.', 'Execute o Setup Inicial (menu → ⚙️ Sistema → ⚙️ Setup Inicial) ou via sidebar'],
    ['4.', 'Populate BNCC: sidebar → 🔧 Configurar → Popular Catálogo BNCC'],
    ['5.', 'Adicione turmas de teste: sidebar → 🔧 Configurar → Inserir Dados de Teste'],
    ['6.', 'Use as ferramentas de IA: 📝 Plano de Aula, 🧠 Questões, ✅ Correção e mais'],
    ['', ''],
    ['LEMBRETES', ''],
    ['•', 'Este painel pode ficar sempre aberto — o sistema funciona enquanto a planilha estiver aberta'],
    ['•', 'As ferramentas do Google Docs (Gerar Questões, Corrigir) funcionam com qualquer Doc aberto'],
    ['•', 'Dados sensíveis (NEE, laudos) ficam protegidos por LGPD nas planilhas TURMAS_ALUNOS'],
    ['•', 'Notas e avaliações geradas pela IA SEMPRE requerem confirmação do professor'],
    ['', ''],
    ['VERSÃO', '1.0 — Abril 2026'],
    ['ESCOLA', 'Colégio Municipal de 1º e 2º Graus de Itabatan'],
    ['SECRETARIA', 'SEME/Mucuri-BA'],
  ];

  aba.getRange(4, 1, instrucoes.length, 2).setValues(instrucoes);

  // Formatação da seção de títulos
  [5, 15, 20].forEach(row => {
    aba.getRange(row, 1).setFontWeight('bold').setFontColor('#1a73e8');
  });

  // Ajuste de colunas
  aba.setColumnWidth(1, 60);
  aba.setColumnWidth(2, 520);
  aba.setFrozenRows(3);

  // Formatação do cabeçalho
  aba.setRowHeight(1, 36);
  aba.getRange('A1:B1').setBackground('#e8f0fe').merge();
  aba.getRange('A2:B2').merge();
}

