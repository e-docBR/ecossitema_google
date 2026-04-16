/**
 * PEDAGOGO.AI — Gestão de Usuários e Papéis (Sprint 5)
 * Arquivo: 17_Usuarios.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Controle central de identidade e acesso.
 * Quem é quem no sistema, quais ferramentas cada papel pode usar.
 *
 * Papéis (hierarquia crescente):
 *   professor → coordenador → gestor → admin
 *
 * Fontes de verdade (em ordem de prioridade):
 *   1. PropertiesService: EMAILS_ADMIN, EMAILS_GESTOR, EMAILS_COORDENADOR, EMAILS_PROFESSOR
 *   2. Aba 'Professores' da planilha TURMAS_ALUNOS (auto-reconhecimento)
 *   3. Proprietário do Drive (fallback de emergência, somente admin)
 */

// ============================================================
// CACHE DE PAPEL (por execução — evita múltiplas leituras)
// ============================================================

/** undefined = não consultado; null = não cadastrado; string = papel */
let _papelUsuarioAtual = undefined;

// ============================================================
// CAPACIDADES POR PAPEL (declaração centralizada)
// ============================================================

const CAPACIDADES = Object.freeze({
  // Quais papéis podem fazer cada ação
  gerarPlano:             [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  gerarQuestoes:          [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  corrigirDiscursiva:     [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  adaptarConteudo:        [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  gerarComunicado:        [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  criarDiagnostico:       [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  lancarFrequencia:       [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  criarProvaDigital:      [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  corrigirLoteRedacoes:   [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  gerarPEI:               [PAPEIS.PROFESSOR, PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  matricularAluno:        [PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  verRelatoriosTodos:     [PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  gerarPautaConselho:     [PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  verDadosSensiveis:      [PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  cadastrarProfessor:     [PAPEIS.COORDENADOR, PAPEIS.GESTOR, PAPEIS.ADMIN],
  gerenciarUsuarios:      [PAPEIS.GESTOR, PAPEIS.ADMIN],
  desativarProfessor:     [PAPEIS.GESTOR, PAPEIS.ADMIN],
  acessarSetup:           [PAPEIS.GESTOR, PAPEIS.ADMIN],
  executarBackup:         [PAPEIS.GESTOR, PAPEIS.ADMIN],
  resetarSistema:         [PAPEIS.ADMIN]
});

// ============================================================
// CONSULTA DE PAPEL
// ============================================================

/**
 * Retorna o papel (role) do e-mail consultado.
 * Ordem de precedência (mais alto primeiro):
 *   1. admin     — EMAILS_ADMIN no PropertiesService
 *   2. gestor    — EMAILS_GESTOR no PropertiesService
 *   3. coordenador — EMAILS_COORDENADOR no PropertiesService
 *   4. professor — EMAILS_PROFESSOR no PropertiesService OU aba Professores
 *   5. null      — não cadastrado → acesso negado
 *
 * Usa cache em memória para o usuário ativo durante a mesma execução.
 *
 * @param {string} [email] - E-mail a consultar (default: usuário ativo)
 * @returns {string|null} papel ou null
 */
function getUsuarioPapel(email) {
  const emailConsulta = (email || getUsuarioAtivo()).trim().toLowerCase();
  const ehAtivo = !email;  // true = consultando o usuário ativo da sessão

  // Cache: só para o usuário ativo (email omitido)
  if (ehAtivo && _papelUsuarioAtual !== undefined) {
    return _papelUsuarioAtual;
  }

  const props = PropertiesService.getScriptProperties();
  const ordem = [PAPEIS.ADMIN, PAPEIS.GESTOR, PAPEIS.COORDENADOR, PAPEIS.PROFESSOR];

  for (const papel of ordem) {
    const lista = _lerListaEmails(`EMAILS_${papel.toUpperCase()}`, props);
    if (lista.includes(emailConsulta)) {
      if (ehAtivo) _papelUsuarioAtual = papel;
      return papel;
    }
  }

  // Fallback 1: verificar na aba Professores (auto-reconhecimento sem precisar
  // cadastrar em EMAILS_PROFESSOR manualmente)
  try {
    const professores = lerProfessores(true);
    if (professores.some(p => p.email.toLowerCase() === emailConsulta)) {
      if (ehAtivo) _papelUsuarioAtual = PAPEIS.PROFESSOR;
      return PAPEIS.PROFESSOR;
    }
  } catch (_) {}

  // Fallback 2: proprietário do Drive (só para usuário ativo — nunca expor por email externo)
  if (ehAtivo) {
    try {
      const ownerEmail = DriveApp.getRootFolder().getOwner().getEmail().toLowerCase();
      if (emailConsulta === ownerEmail) {
        // Registrar uso do fallback de emergência para auditoria
        registrarLog('AUDITORIA',
          `Acesso via proprietário do Drive (fallback): ${emailConsulta}`,
          'Configure EMAILS_ADMIN para remover esta dependência'
        );
        _papelUsuarioAtual = PAPEIS.ADMIN;
        return PAPEIS.ADMIN;
      }
    } catch (_) {}
    _papelUsuarioAtual = null;
  }

  return null;
}

/**
 * Invalida o cache de papel do usuário atual.
 * Chamado após qualquer alteração de papéis.
 */
function invalidarCachePapel() {
  _papelUsuarioAtual = undefined;
}

/**
 * Retorna o nível numérico de um papel (para comparações).
 * @param {string|null} papel
 * @returns {number} 0=sem acesso, 1=professor, 2=coordenador, 3=gestor, 4=admin
 */
function nivelPapel(papel) {
  const mapa = {
    [PAPEIS.PROFESSOR]:   1,
    [PAPEIS.COORDENADOR]: 2,
    [PAPEIS.GESTOR]:      3,
    [PAPEIS.ADMIN]:       4
  };
  return mapa[papel] || 0;
}

/**
 * Verifica se o usuário ativo tem capacidade para uma ação específica.
 * Usa a tabela CAPACIDADES declarada no topo deste arquivo.
 *
 * @param {string} acao - chave de CAPACIDADES
 * @returns {boolean}
 */
function temCapacidade(acao) {
  const papel = getUsuarioPapel();
  const papeis = CAPACIDADES[acao] || [];
  return papeis.includes(papel);
}

// ============================================================
// PERFIL DO USUÁRIO ATUAL
// ============================================================

/**
 * Retorna o perfil completo do usuário ativo para a interface.
 * Nunca lança exceção — retorna dados parciais se necessário.
 *
 * @returns {{
 *   email: string,
 *   papel: string,
 *   papelLabel: string,
 *   nivelAcesso: number,
 *   ehAdmin: boolean,
 *   ehGestor: boolean,
 *   ehCoordenador: boolean,
 *   ehProfessor: boolean,
 *   ehCadastrado: boolean,
 *   capacidades: Object
 * }}
 */
function obterPerfilUsuarioAtual() {
  const email = getUsuarioAtivo();
  const papel = getUsuarioPapel();  // usa cache
  const nivel = nivelPapel(papel);

  const labelMap = {
    [PAPEIS.ADMIN]:       'Administrador',
    [PAPEIS.GESTOR]:      'Gestor(a)',
    [PAPEIS.COORDENADOR]: 'Coordenador(a)',
    [PAPEIS.PROFESSOR]:   'Professor(a)'
  };

  // Capacidades derivadas: calculadas aqui para evitar múltiplas chamadas no frontend
  const caps = {};
  Object.keys(CAPACIDADES).forEach(acao => {
    caps[acao] = papel ? CAPACIDADES[acao].includes(papel) : false;
  });

  return {
    email:          email,
    papel:          papel || 'nao_cadastrado',
    papelLabel:     labelMap[papel] || 'Não cadastrado',
    nivelAcesso:    nivel,
    ehCadastrado:   nivel > 0,
    ehAdmin:        nivel >= 4,
    ehGestor:       nivel >= 3,
    ehCoordenador:  nivel >= 2,
    ehProfessor:    nivel >= 1,
    capacidades:    caps
  };
}

// ============================================================
// GERENCIAMENTO DE USUÁRIOS
// ============================================================

/**
 * Retorna todos os usuários cadastrados por papel.
 * Inclui professores da planilha (auto-reconhecimento) sem duplicar.
 *
 * @returns {{admin:string[], gestor:string[], coordenador:string[], professor:string[]}}
 */
function listarUsuariosPorPapel() {
  const props = PropertiesService.getScriptProperties();
  const resultado = {};

  [PAPEIS.ADMIN, PAPEIS.GESTOR, PAPEIS.COORDENADOR, PAPEIS.PROFESSOR].forEach(papel => {
    resultado[papel] = _lerListaEmails(`EMAILS_${papel.toUpperCase()}`, props);
  });

  // Incluir professores da planilha sem duplicar
  try {
    const profsPlanilha = lerProfessores(true).map(p => p.email.toLowerCase());
    profsPlanilha.forEach(email => {
      if (!resultado[PAPEIS.PROFESSOR].includes(email)) {
        resultado[PAPEIS.PROFESSOR].push(email);
      }
    });
  } catch (_) {}

  return resultado;
}

/**
 * Adiciona um e-mail a um papel.
 * Remove automaticamente do papel anterior se existir (um e-mail, um papel).
 * Requer papel mínimo: GESTOR.
 *
 * @param {string} email
 * @param {string} papel - PAPEIS.PROFESSOR | PAPEIS.COORDENADOR | PAPEIS.GESTOR | PAPEIS.ADMIN
 */
function adicionarUsuarioAoPapel(email, papel) {
  verificarPermissao(PAPEIS.GESTOR);

  const emailNorm = email.trim().toLowerCase();
  if (!emailNorm.includes('@')) throw new Error(`E-mail inválido: ${email}`);
  if (!Object.values(PAPEIS).includes(papel)) throw new Error(`Papel inválido: ${papel}`);

  // Remover de qualquer papel anterior (garante: 1 email → 1 papel)
  const props = PropertiesService.getScriptProperties();
  [PAPEIS.ADMIN, PAPEIS.GESTOR, PAPEIS.COORDENADOR, PAPEIS.PROFESSOR].forEach(p => {
    if (p === papel) return;
    const chave = `EMAILS_${p.toUpperCase()}`;
    const lista = _lerListaEmails(chave, props);
    if (lista.includes(emailNorm)) {
      props.setProperty(chave, lista.filter(e => e !== emailNorm).join(','));
    }
  });

  // Adicionar ao novo papel
  const chave = `EMAILS_${papel.toUpperCase()}`;
  const lista = _lerListaEmails(chave, props);
  if (!lista.includes(emailNorm)) {
    lista.push(emailNorm);
    props.setProperty(chave, lista.join(','));
  }

  invalidarCachePapel();
  registrarLog('AUDITORIA', `Usuário adicionado ao papel [${papel}]`, emailNorm);
}

/**
 * Remove um e-mail de um papel específico.
 * Requer papel mínimo: GESTOR.
 *
 * @param {string} email
 * @param {string} papel
 */
function removerUsuarioDoPapel(email, papel) {
  verificarPermissao(PAPEIS.GESTOR);

  const emailNorm = email.trim().toLowerCase();
  const props = PropertiesService.getScriptProperties();
  const chave = `EMAILS_${papel.toUpperCase()}`;
  const lista = _lerListaEmails(chave, props);

  props.setProperty(chave, lista.filter(e => e !== emailNorm).join(','));
  invalidarCachePapel();
  registrarLog('AUDITORIA', `Usuário removido do papel [${papel}]`, emailNorm);
}

/**
 * Configura em lote os e-mails de gestão (coordenação, direção, secretaria).
 * Chamado pela sidebar durante as configurações iniciais.
 * Requer papel mínimo: GESTOR.
 *
 * @param {{coordenacao:string, direcao:string, secretaria:string}} emails
 */
function configurarEmailsGestao(emails) {
  verificarPermissao(PAPEIS.GESTOR);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const props = PropertiesService.getScriptProperties();

  if (emails.coordenacao && emailRegex.test(emails.coordenacao.trim())) {
    props.setProperty('EMAIL_COORDENACAO', emails.coordenacao.trim());
    adicionarUsuarioAoPapel(emails.coordenacao.trim(), PAPEIS.COORDENADOR);
  }
  if (emails.direcao && emailRegex.test(emails.direcao.trim())) {
    props.setProperty('EMAIL_DIRECAO', emails.direcao.trim());
    adicionarUsuarioAoPapel(emails.direcao.trim(), PAPEIS.GESTOR);
  }
  if (emails.secretaria && emailRegex.test(emails.secretaria.trim())) {
    props.setProperty('EMAIL_SECRETARIA', emails.secretaria.trim());
    adicionarUsuarioAoPapel(emails.secretaria.trim(), PAPEIS.COORDENADOR);
  }

  invalidarConfigCache();
  registrarLog('AUDITORIA', 'E-mails de gestão configurados', JSON.stringify(emails));
}

// ============================================================
// INICIALIZAÇÃO DO ADMIN (primeira vez)
// ============================================================

/**
 * Registra o usuário ativo como ADMIN do sistema.
 * Usado no primeiro acesso quando EMAILS_ADMIN está vazio.
 * Não requer verificação de permissão (bootstrap).
 *
 * @returns {{sucesso: boolean, mensagem: string}}
 */
function registrarMeComoAdmin() {
  const email = getUsuarioAtivo();
  const props = PropertiesService.getScriptProperties();
  const lista = _lerListaEmails('EMAILS_ADMIN', props);

  if (lista.length > 0) {
    // Já existe admin — bloquear (apenas o admin existente pode promover)
    try {
      verificarPermissao(PAPEIS.ADMIN);
    } catch (_) {
      return { sucesso: false, mensagem: 'Já existe um administrador cadastrado. Contate o administrador para ser adicionado.' };
    }
  }

  lista.push(email.toLowerCase());
  props.setProperty('EMAILS_ADMIN', lista.join(','));
  invalidarCachePapel();
  registrarLog('AUDITORIA', `Admin auto-registrado: ${email}`);
  return { sucesso: true, mensagem: `${email} registrado como Administrador com sucesso!` };
}

// ============================================================
// WRAPPERS HTML
// ============================================================

/**
 * Retorna o perfil do usuário ativo para o frontend.
 * Chamado no carregamento da sidebar/webapp para configurar a UI.
 * @returns {Object} perfil completo
 */
function obterPerfilUsuarioHTML() {
  try {
    return obterPerfilUsuarioAtual();
  } catch (e) {
    registrarLog('ERRO', 'obterPerfilUsuarioHTML: ' + e.message);
    return {
      email: getUsuarioAtivo(), papel: 'nao_cadastrado', papelLabel: 'Não cadastrado',
      nivelAcesso: 0, ehCadastrado: false,
      ehAdmin: false, ehGestor: false, ehCoordenador: false, ehProfessor: false,
      capacidades: {}
    };
  }
}

/**
 * Lista todos os usuários por papel (painel admin).
 * @returns {{sucesso:boolean, usuarios?:Object, mensagem?:string}}
 */
function listarUsuariosHTML() {
  try {
    verificarPermissao(PAPEIS.GESTOR);
    return { sucesso: true, usuarios: listarUsuariosPorPapel() };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Adiciona usuário a um papel (painel admin).
 * @param {string} email
 * @param {string} papel
 * @returns {{sucesso:boolean, mensagem:string}}
 */
function adicionarUsuarioHTML(email, papel) {
  try {
    adicionarUsuarioAoPapel(email, papel);
    const labels = {
      professor: 'Professor(a)', coordenador: 'Coordenador(a)',
      gestor: 'Gestor(a)', admin: 'Administrador'
    };
    return { sucesso: true, mensagem: `${email} definido(a) como ${labels[papel] || papel}.` };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Remove usuário de um papel (painel admin).
 * @param {string} email
 * @param {string} papel
 * @returns {{sucesso:boolean, mensagem:string}}
 */
function removerUsuarioHTML(email, papel) {
  try {
    removerUsuarioDoPapel(email, papel);
    return { sucesso: true, mensagem: `${email} removido(a) do papel ${papel}.` };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Registra o usuário ativo como admin (bootstrap — primeira vez).
 * @returns {{sucesso:boolean, mensagem:string}}
 */
function registrarMeComoAdminHTML() {
  try {
    return registrarMeComoAdmin();
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Configura e-mails de gestão e seus papéis em lote.
 * @param {{coordenacao:string, direcao:string, secretaria:string}} emails
 * @returns {{sucesso:boolean, mensagem:string}}
 */
function configurarEmailsGestaoHTML(emails) {
  try {
    configurarEmailsGestao(emails);
    return { sucesso: true, mensagem: 'E-mails de gestão configurados e papéis atribuídos com sucesso.' };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

// ============================================================
// UTILIDADES PRIVADAS
// ============================================================

/**
 * Lê e normaliza a lista de e-mails de uma chave do PropertiesService.
 * @private
 * @param {string} chave
 * @param {GoogleAppsScript.Properties.Properties} props
 * @returns {string[]} lista de e-mails em lowercase
 */
function _lerListaEmails(chave, props) {
  return (props.getProperty(chave) || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@'));
}
