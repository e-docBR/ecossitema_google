/**
 * PEDAGOGO.AI — Serviço de Pasta Individual do Professor
 * Arquivo: 16_PastaProfessor.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Garante que CADA professor tem uma pasta exclusiva no Drive dentro de
 * 06_PROFESSORES/{slug_email}/  com as seguintes regras de acesso:
 *
 *  • Professor:       EDITOR  (vê e edita apenas seus próprios documentos)
 *  • Coordenadores:   LEITOR  (podem visualizar tudo para supervisão pedagógica)
 *  • Gestor/Admin:    EDITOR  (acesso total para fins administrativos)
 *  • Outros prof.:    SEM ACESSO
 *
 * Sprint 3 — Funcionalidade principal solicitada pelo usuário.
 */

// ============================================================
// SUBPASTAS PADRÃO DE CADA PROFESSOR
// ============================================================

const SUBPASTAS_PROFESSOR = Object.freeze([
  'Planos_de_Aula',
  'Avaliacoes',
  'Diagnosticos',
  'Comunicados',
  'Relatorios',
  'PEI_Rascunhos'   // PEI finalizados vão para 04_ALUNOS/PEI_PDI
]);

// ============================================================
// CACHE DE PASTAS (evitar chamadas repetidas ao Drive)
// ============================================================

/** Mapa email → ID da pasta na execução atual */
let _cachePastasProfessores = {};

// ============================================================
// FUNÇÕES PRINCIPAIS
// ============================================================

/**
 * Retorna (ou cria) a pasta exclusiva do professor atualmente logado.
 * Chamada automaticamente antes de salvar qualquer documento pedagógico.
 *
 * @returns {GoogleAppsScript.Drive.Folder} Pasta pessoal do professor
 */
function obterPastaProfessorAtual() {
  const email = getUsuarioAtivo();
  return obterPastaProfessor(email);
}

/**
 * Retorna (ou cria) a pasta exclusiva de um professor específico.
 *
 * @param {string} emailProfessor - E-mail institucional do professor
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function obterPastaProfessor(emailProfessor) {
  if (!emailProfessor) throw new Error('E-mail do professor não informado.');

  // Cache em memória (mesma execução)
  if (_cachePastasProfessores[emailProfessor]) {
    return DriveApp.getFolderById(_cachePastasProfessores[emailProfessor]);
  }

  // Verificar PropertiesService (persistente entre execuções)
  const chave = `ID_PASTA_PROF_${emailParaSlug(emailProfessor)}`;
  const idSalvo = PropertiesService.getScriptProperties().getProperty(chave);
  if (idSalvo) {
    try {
      const pasta = DriveApp.getFolderById(idSalvo);
      _cachePastasProfessores[emailProfessor] = idSalvo;
      return pasta;
    } catch (_) {
      // Pasta foi deletada — recriar
    }
  }

  // Criar nova pasta
  return criarPastaProfessor(emailProfessor);
}

/**
 * Cria a pasta exclusiva de um professor e configura permissões.
 * Chamado pelo SetupInicial ou na primeira vez que o professor acessa o sistema.
 *
 * @param {string} emailProfessor
 * @returns {GoogleAppsScript.Drive.Folder} Pasta criada
 */
function criarPastaProfessor(emailProfessor) {
  const config = getConfig();
  const idPastasProfessores = config.DRIVE.PROFESSORES;
  if (!idPastasProfessores) {
    throw new Error('Pasta 06_PROFESSORES não configurada. Execute o Setup Inicial primeiro.');
  }

  const pastaMae = DriveApp.getFolderById(idPastasProfessores);

  // Nome da pasta: slug do e-mail para evitar caracteres inválidos
  const nomePasta = emailParaSlug(emailProfessor);
  const pasta = buscarOuCriarPasta(nomePasta, pastaMae);

  // Criar subpastas padrão
  SUBPASTAS_PROFESSOR.forEach(sub => buscarOuCriarPasta(sub, pasta));

  // Configurar permissões
  configurarPermissoesPastaProfessor(pasta, emailProfessor);

  // Salvar ID nas propriedades e na planilha Professores
  const chave = `ID_PASTA_PROF_${nomePasta}`;
  salvarPropriedade(chave, pasta.getId());
  _cachePastasProfessores[emailProfessor] = pasta.getId();
  try { atualizarIdPastaProfessor(emailProfessor, pasta.getId()); } catch (_) {}

  registrarLog('INFO', `Pasta do professor criada: ${nomePasta}`, pasta.getId());
  return pasta;
}

/**
 * Configura permissões corretas na pasta do professor:
 *  - Professor: Editor
 *  - Coordenadores/Gestor/Admin: Leitor
 *  - Outros: sem acesso
 *
 * @param {GoogleAppsScript.Drive.Folder} pasta
 * @param {string} emailProfessor
 */
function configurarPermissoesPastaProfessor(pasta, emailProfessor) {
  try {
    // Remover acesso geral (pasta privada)
    pasta.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);

    // Professor tem acesso de editor
    if (emailProfessor && emailProfessor.includes('@')) {
      pasta.addEditor(emailProfessor);
    }

    // Coordenadores e Gestores têm acesso de visualizador
    _obterEmailsSuperiores().forEach(email => {
      if (email && email !== emailProfessor) {
        try { pasta.addViewer(email); } catch (_) {}
      }
    });

    registrarLog('INFO', `Permissões configuradas para pasta de ${emailProfessor}`);
  } catch (e) {
    registrarLog('ALERTA', `Não foi possível configurar permissões da pasta: ${e.message}`, emailProfessor);
  }
}

/**
 * Retorna a lista de e-mails de usuários com papel de coordenador, gestor ou admin.
 * @private
 * @returns {string[]}
 */
function _obterEmailsSuperiores() {
  const props = PropertiesService.getScriptProperties();
  const config = getConfig();
  const emails = new Set();

  // E-mails configurados na estrutura
  [config.EMAIL.COORDENACAO, config.EMAIL.DIRECAO, config.EMAIL.SECRETARIA]
    .forEach(e => { if (e) emails.add(e); });

  // E-mails dos papéis hierárquicos
  [PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN].forEach(papel => {
    const lista = props.getProperty(`EMAILS_${papel.toUpperCase()}`) || '';
    lista.split(',').forEach(e => { if (e.trim()) emails.add(e.trim()); });
  });

  return [...emails];
}

// ============================================================
// SALVAR DOCUMENTOS NA PASTA DO PROFESSOR
// ============================================================

/**
 * Salva um arquivo na subpasta correta do professor atual.
 * Determina automaticamente a subpasta pelo tipo de documento.
 *
 * @param {string} docId        - ID do Google Doc/File
 * @param {string} tipoDocumento - 'plano_aula' | 'avaliacao' | 'diagnostico' | 'comunicado' | 'relatorio' | 'pei_rascunho'
 * @param {string} [nomePasta]  - Subpasta adicional dentro do tipo (opcional)
 * @returns {string} URL do arquivo na pasta do professor
 */
function salvarNaPastaProfessor(docId, tipoDocumento, nomePasta) {
  const pastaProfessor = obterPastaProfessorAtual();
  const subpastaNome = _mapearTipoParaSubpasta(tipoDocumento);
  const subpastas = pastaProfessor.getFoldersByName(subpastaNome);
  let subpasta = subpastas.hasNext()
    ? subpastas.next()
    : pastaProfessor.createFolder(subpastaNome);

  // Pasta adicional dentro do tipo (ex: ano/turma)
  if (nomePasta) {
    subpasta = buscarOuCriarPasta(nomePasta, subpasta);
  }

  const arquivo = DriveApp.getFileById(docId);
  arquivo.moveTo(subpasta);

  registrarLog('INFO', `Doc salvo na pasta do professor`, `Tipo: ${tipoDocumento} | ${arquivo.getName()}`);
  return arquivo.getUrl();
}

/**
 * Mapeia tipo de documento para nome da subpasta.
 * @private
 */
function _mapearTipoParaSubpasta(tipo) {
  const mapa = {
    'plano_aula':    'Planos_de_Aula',
    'avaliacao':     'Avaliacoes',
    'diagnostico':   'Diagnosticos',
    'comunicado':    'Comunicados',
    'relatorio':     'Relatorios',
    'pei_rascunho':  'PEI_Rascunhos'
  };
  return mapa[tipo] || 'Outros';
}

/**
 * Obtém a subpasta de um tipo específico dentro da pasta do professor.
 * Cria a subpasta se não existir.
 *
 * @param {string} tipoDocumento
 * @param {string} [nomePastaExtra] - Subsubpasta adicional (ex: '2026_7A_Matematica')
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function obterSubpastaProfessor(tipoDocumento, nomePastaExtra) {
  const pastaProfessor = obterPastaProfessorAtual();
  const subpastaNome = _mapearTipoParaSubpasta(tipoDocumento);
  const subpastas = pastaProfessor.getFoldersByName(subpastaNome);
  let subpasta = subpastas.hasNext()
    ? subpastas.next()
    : pastaProfessor.createFolder(subpastaNome);

  if (nomePastaExtra) {
    subpasta = buscarOuCriarPasta(nomePastaExtra, subpasta);
  }
  return subpasta;
}

// ============================================================
// LISTAGEM DE DOCUMENTOS
// ============================================================

/**
 * Lista todos os documentos recentes do professor atual.
 * Ordenados por data de modificação (mais recentes primeiro).
 *
 * @param {string} [tipo] - Filtrar por tipo de documento (opcional)
 * @param {number} [limite=20]
 * @returns {{nome:string, url:string, tipo:string, data:string}[]}
 */
function listarDocumentosProfessor(tipo, limite) {
  try {
    const pastaProfessor = obterPastaProfessorAtual();
    const maxItems = limite || 20;
    const resultado = [];

    const subpastasParaBuscar = tipo
      ? [_mapearTipoParaSubpasta(tipo)]
      : SUBPASTAS_PROFESSOR;

    subpastasParaBuscar.forEach(nomeSubpasta => {
      const iter = pastaProfessor.getFoldersByName(nomeSubpasta);
      if (!iter.hasNext()) return;
      const subpasta = iter.next();

      const arquivos = subpasta.getFiles();
      while (arquivos.hasNext() && resultado.length < maxItems) {
        const arquivo = arquivos.next();
        resultado.push({
          nome: arquivo.getName(),
          url:  arquivo.getUrl(),
          tipo: nomeSubpasta,
          data: formatarData(arquivo.getLastUpdated(), 'dd/MM/yyyy HH:mm'),
          id:   arquivo.getId()
        });
      }
    });

    // Ordenar por data (mais recente primeiro) — limitação: Date.getTime()
    return resultado
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, maxItems);
  } catch (e) {
    registrarLog('ERRO', 'Erro ao listar documentos do professor: ' + e.message);
    return [];
  }
}

// ============================================================
// COMPARTILHAMENTO
// ============================================================

/**
 * Move um documento do professor para a pasta _COMPARTILHADOS.
 * Apenas coordenadores/gestores podem fazer isso programaticamente.
 * Professores podem compartilhar manualmente pelo Drive.
 *
 * @param {string} docId
 * @param {string} subpasta - 'Templates_Aprovados' | 'Boas_Praticas'
 * @returns {string} URL do arquivo compartilhado
 */
function compartilharDocumentoParaTodos(docId, subpasta) {
  verificarPermissao(PAPEIS.COORDENADOR);

  const config = getConfig();
  const idCompartilhados = config.DRIVE.COMPARTILHADOS;
  if (!idCompartilhados) throw new Error('Pasta _COMPARTILHADOS não configurada.');

  const pastaComp = DriveApp.getFolderById(idCompartilhados);
  const pastaDestino = buscarOuCriarPasta(subpasta || 'Boas_Praticas', pastaComp);

  const arquivo = DriveApp.getFileById(docId);
  arquivo.moveTo(pastaDestino);

  // Tornar visível para todos os professores
  arquivo.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);

  registrarLog('INFO', `Documento compartilhado para toda a escola: ${arquivo.getName()}`);
  return arquivo.getUrl();
}

// ============================================================
// SETUP — CRIAÇÃO EM LOTE DE PASTAS DE PROFESSORES
// ============================================================

/**
 * Cria pastas para todos os professores cadastrados na planilha TURMAS_ALUNOS.
 * Chamado durante o Setup Inicial (Etapa 7) e também quando novos professores
 * são cadastrados.
 *
 * @returns {{criadas: number, existentes: number, erros: number}}
 */
function criarPastasParaTodosProfessores() {
  const config = getConfig();
  if (!config.SHEETS.TURMAS_ALUNOS) {
    throw new Error('Planilha TURMAS_ALUNOS não configurada.');
  }

  let criadas = 0, existentes = 0, erros = 0;

  const professores = listarProfessoresCadastrados();

  professores.forEach(prof => {
    if (!prof.email || !prof.email.includes('@')) return;
    try {
      const chave = `ID_PASTA_PROF_${emailParaSlug(prof.email)}`;
      const idExistente = PropertiesService.getScriptProperties().getProperty(chave);
      if (idExistente) {
        try { DriveApp.getFolderById(idExistente); existentes++; return; } catch (_) {}
      }
      criarPastaProfessor(prof.email);
      criadas++;
    } catch (e) {
      registrarLog('ERRO', `Erro ao criar pasta para ${prof.email}: ${e.message}`);
      erros++;
    }
  });

  registrarLog('INFO', `Pastas de professores: ${criadas} criadas, ${existentes} existentes, ${erros} erros`);
  return { criadas, existentes, erros };
}

/**
 * Retorna lista de professores cadastrados na planilha.
 * Delega para lerProfessores() de 04_SheetsService.gs para garantir
 * consistência com o schema da aba 'Professores' (Email col 0, Nome col 1...).
 * @returns {{nome:string, email:string, componentes:string[], turmas:string[], ativo:boolean}[]}
 */
function listarProfessoresCadastrados() {
  try {
    return lerProfessores(true);  // apenasAtivos=true
  } catch (e) {
    registrarLog('ALERTA', 'Não foi possível listar professores: ' + e.message);
    return [];
  }
}

/**
 * Cadastra um novo professor na planilha e cria sua pasta no Drive.
 *
 * @param {Object} dados - {nome, email, disciplinas[], turmas[], formacao}
 * @returns {{sucesso: boolean, pastaUrl?: string, mensagem?: string}}
 */
function cadastrarProfessor(dados) {
  verificarPermissao(PAPEIS.COORDENADOR);

  if (!dados.email || !dados.email.includes('@')) {
    return { sucesso: false, mensagem: 'E-mail inválido.' };
  }
  if (!dados.nome) {
    return { sucesso: false, mensagem: 'Nome do professor é obrigatório.' };
  }

  try {
    const config = getConfig();
    const id = `PROF-${formatarData(new Date(), 'yyyy')}-${emailParaSlug(dados.email).substring(0, 8).toUpperCase()}`;

    // Inserir na planilha — colunas conforme schema de 04_SheetsService.gs:
    // Email | Nome_Completo | Componentes | Turmas | Papel | Ativo | Data_Cadastro | ID_Pasta_Drive | Formacao | Telefone | Observacoes
    escreverLinha(config.SHEETS.TURMAS_ALUNOS, 'Professores', [
      dados.email,
      dados.nome,
      (dados.disciplinas || dados.componentes || []).join(', '),
      (dados.turmas || []).join(', '),
      dados.papel || 'professor',
      'TRUE',
      formatarData(new Date(), 'dd/MM/yyyy'),
      '',   // ID_Pasta_Drive — preenchido por atualizarIdPastaProfessor() após criar pasta
      dados.formacao    || '',
      dados.telefone    || '',
      dados.observacoes || ''
    ]);

    // Criar pasta no Drive
    const pasta = criarPastaProfessor(dados.email);

    // E-mail de boas-vindas
    _enviarBoasVindasProfessor(dados, pasta.getUrl());

    registrarLog('INFO', `Professor cadastrado: ${dados.nome} (${dados.email})`);
    return { sucesso: true, pastaUrl: pasta.getUrl() };
  } catch (e) {
    registrarLog('ERRO', `Erro ao cadastrar professor ${dados.email}: ${e.message}`);
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Envia e-mail de boas-vindas ao professor recém-cadastrado.
 * @private
 */
function _enviarBoasVindasProfessor(dados, pastaUrl) {
  const config = getConfig();
  enviarEmailAlerta(
    dados.email,
    'Bem-vindo(a) ao PEDAGOGO.AI!',
    `<p>Olá, <strong>${dados.nome}</strong>!</p>
     <p>Seu acesso ao sistema <strong>PEDAGOGO.AI</strong> foi configurado.</p>
     <p>Sua pasta pessoal no Google Drive está disponível em:<br>
     <a href="${pastaUrl}" style="color:#1a73e8;">${pastaUrl}</a></p>
     <p>Todos os seus planos de aula, avaliações, diagnósticos e comunicados gerados
     pelo sistema serão salvos automaticamente nessa pasta, com acesso exclusivo para
     você e a coordenação pedagógica.</p>
     <p>Escola: ${config.ESCOLA} | ${config.SECRETARIA}</p>
     <p>Em caso de dúvidas, entre em contato com a coordenação.</p>`
  );
}

/**
 * Desativa um professor (coluna Ativo = FALSE) e revoga acesso à sua pasta.
 * Documentos permanecem acessíveis para a coordenação.
 *
 * @param {string} emailProfessor
 * @returns {{sucesso: boolean, mensagem?: string}}
 */
function desativarProfessor(emailProfessor) {
  verificarPermissao(PAPEIS.GESTOR);

  try {
    const config = getConfig();
    // Schema: Email=col0, Ativo=col5 — busca por email (col0), muda Ativo (col5)
    atualizarLinha(config.SHEETS.TURMAS_ALUNOS, 'Professores', 0, emailProfessor, { 5: 'FALSE' });

    // Revogar acesso de editor na pasta (pasta fica somente leitura)
    const chave = `ID_PASTA_PROF_${emailParaSlug(emailProfessor)}`;
    const idPasta = PropertiesService.getScriptProperties().getProperty(chave);
    if (idPasta) {
      const pasta = DriveApp.getFolderById(idPasta);
      try { pasta.removeEditor(emailProfessor); } catch (_) {}
      try { pasta.addViewer(emailProfessor); } catch (_) {}  // leitura fica
    }

    registrarLog('AUDITORIA', `Professor desativado: ${emailProfessor}`);
    return { sucesso: true };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

// ============================================================
// WRAPPERS HTML (chamados via google.script.run)
// ============================================================

function listarDocumentosProfessorHTML(tipo) {
  try {
    return { sucesso: true, documentos: listarDocumentosProfessor(tipo, 30) };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function cadastrarProfessorHTML(dados) {
  try {
    return cadastrarProfessor(dados);
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function listarProfessoresCadastradosHTML() {
  try {
    return { sucesso: true, professores: listarProfessoresCadastrados() };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function criarPastasParaTodosProfessoresHTML() {
  try {
    const resultado = criarPastasParaTodosProfessores();
    return {
      sucesso: true,
      mensagem: `${resultado.criadas} pasta(s) criada(s), ${resultado.existentes} já existiam.`
    };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}
