/**
 * PEDAGOGO.AI — Menu de IA Generativa (Bloco 6)
 * Arquivo: 10_MenuIA.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Menu customizado no Google Docs e Sheets com 8 ferramentas de IA.
 * Acesso via Menu > PEDAGOGO.AI ou atalhos de teclado documentados.
 *
 * Referência: Bloco 6.1, 6.2 do prompt mestre
 */

// ============================================================
// MENU CUSTOMIZADO (onOpen)
// ============================================================

/**
 * Cria o menu PEDAGOGO.AI quando o documento é aberto.
 * Compatível com Google Docs e Google Sheets.
 */
function onOpen() {
  try {
    let ui;
    try { ui = DocumentApp.getUi(); } catch(e) {}
    try { if (!ui) ui = SpreadsheetApp.getUi(); } catch(e) {}
    if (!ui) return;

    ui.createMenu('🤖 PEDAGOGO.AI')
      .addItem('📌 Abrir Painel PEDAGOGO.AI',                    'abrirSidebar')
      .addSeparator()
      .addItem('🧠 Gerar Questões da Seleção  [Ctrl+Shift+Q]', 'gerarQuestoesDaSelecao')
      .addItem('📝 Plano de Aula Rápido  [Ctrl+Shift+P]',      'planoDeAulaRapido')
      .addItem('✅ Corrigir Selecionado  [Ctrl+Shift+C]',       'corrigirSelecionado')
      .addSeparator()
      .addSubMenu(
        ui.createMenu('🎓 Ferramentas Pedagógicas')
          .addItem('♿ Adaptar para NEE/EJA',           'adaptarParaNEE')
          .addItem('📊 Relatório da Turma',              'gerarRelatorioTurmaDocs')
          .addItem('📧 Comunicado para Família',         'redigirComunicadoFamilia')
          .addItem('🎯 Diagnóstico Formativo',           'criarDiagnosticoFormativo')
          .addItem('📋 Pauta de Conselho de Classe',     'gerarPautaReuniao')
          .addItem('📝 Gerar PEI/PDI (NEE)',             'gerarPEIViaMenu')
          .addItem('📄 Criar Prova Digital (Forms)',     'criarProvaDigitalViaMenu')
          .addItem('📚 Corrigir Lote de Redações',       'corrigirLoteViaMenu')
      )
      .addSeparator()
      .addSubMenu(
        ui.createMenu('⚙️ Sistema')
          .addItem('� Setup Inicial',                      'executarSetupCompleto')
          .addSeparator()
          .addItem('�🔍 Diagnóstico do Sistema',          'executarDiagnosticoUI')
          .addItem('📁 Abrir Pasta PEDAGOGO.AI',         'abrirPastaPedagogo')
          .addSeparator()
          .addItem('🌱 Popular BNCC Inicial',            'popularBNCCViaMenu')
          .addItem('🧪 Popular Dados de Teste',          'popularDadosTesteViaMenu')
          .addItem('🗑️ Limpar Dados de Teste',           'limparDadosTesteViaMenu')
          .addSeparator()
          .addItem('ℹ️ Sobre o PEDAGOGO.AI',             'mostrarSobre')
      )
      .addToUi();
  } catch (e) {
    // Silencioso — o menu pode não estar disponível em todos os contextos
    console.log('Menu PEDAGOGO.AI não disponível neste contexto: ' + e.message);
  }
}

// ============================================================
// WEB APP — doGet + funções exclusivas do webapp
// ============================================================

/**
 * Entry point do Web App.
 * URL de acesso: https://script.google.com/macros/s/{scriptId}/exec
 */
function doGet(_e) {
  try {
    const template = HtmlService.createTemplateFromFile('WebApp');
    template.usuario = Session.getActiveUser().getEmail() || 'Convidado';
    return template.evaluate()
      .setTitle('PEDAGOGO.AI — Gestão Pedagógica')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<p style="font-family:Roboto,sans-serif;padding:24px;color:#d93025;">' +
      '❌ Erro ao iniciar o PEDAGOGO.AI: ' + err.message + '</p>'
    );
  }
}

/**
 * Retorna o perfil completo do usuário ativo para a interface.
 * Chamado uma vez por carregamento de página — sem parâmetros sensíveis.
 * @returns {Object} perfil do usuário com email, papel, nivelAcesso e capacidades
 */
function obterPerfilUsuarioAtualHTML() {
  try {
    return obterPerfilUsuarioAtual();
  } catch (e) {
    registrarLog('ERRO', 'obterPerfilUsuarioAtualHTML: ' + e.message);
    return { email: getUsuarioAtivo(), papel: 'nao_cadastrado', nivelAcesso: 0,
             papelLabel: 'Não cadastrado', ehCadastrado: false,
             ehProfessor: false, ehCoordenador: false, ehGestor: false, ehAdmin: false,
             capacidades: {} };
  }
}

/**
 * Wrapper para listarUsuariosPorPapel — requer GESTOR.
 * @returns {Object|{erro, mensagem}}
 */
function listarUsuariosPorPapelHTML() {
  try {
    verificarPermissao(PAPEIS.GESTOR);
    return listarUsuariosPorPapel();
  } catch (e) {
    return { erro: true, mensagem: e.message };
  }
}

/**
 * Wrapper para adicionarUsuarioAoPapel — requer GESTOR.
 */
function adicionarUsuarioAoPapelHTML(email, papel) {
  try {
    adicionarUsuarioAoPapel(email, papel);
    return { sucesso: true, mensagem: `${email} adicionado como ${papel}.` };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Wrapper para removerUsuarioDoPapel — requer GESTOR.
 */
function removerUsuarioDoPapelHTML(email, papel) {
  try {
    removerUsuarioDoPapel(email, papel);
    return { sucesso: true, mensagem: `${email} removido do papel ${papel}.` };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Bootstrap: registrar o usuário atual como admin (só funciona se EMAILS_ADMIN estiver vazio).
 */
function registrarMeComoAdminHTML() {
  try {
    const msg = registrarMeComoAdmin();
    return { sucesso: true, mensagem: msg };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Retorna estatísticas para o Dashboard do webapp.
 * @returns {{turmasAtivas, bnccCount, geminiOk, pastasOk, planilhasOk, emailOk}}
 */
function obterDashboardHTML() {
  const s = obterStatusConfiguracaoHTML();
  const provider = getProvedorAtivo();
  const props = PropertiesService.getScriptProperties();
  const iaOk = provider === 'gemini'      ? !!props.getProperty('GEMINI_KEY')
             : provider === 'openrouter'  ? !!props.getProperty('OPENROUTER_KEY')
             : provider === 'ollama'      ? !!props.getProperty('OLLAMA_ENDPOINT')
             : false;
  return {
    turmasAtivas: s.turmasCount   || 0,
    bnccCount:    s.bnccCount     || 0,
    geminiOk:     iaOk,
    pastasOk:     s.pastasConfiguradas,
    planilhasOk:  !!(s.planilhaTurmas && s.planilhaBNCC),
    emailOk:      s.emailCoordenacao
  };
}

/**
 * Gera questões a partir de texto colado pelo usuário (versão webapp — sem seleção de Docs).
 * @param {string} texto
 * @returns {{sucesso:boolean, questoes?:string, mensagem?:string}}
 */
function gerarQuestoesTextoHTML(texto) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    if (!texto || texto.trim().length < 50) {
      return { sucesso: false, mensagem: 'Texto muito curto. Forneça pelo menos um parágrafo.' };
    }
    const prompt =
      'Com base no seguinte texto, gere 5 questões variadas (3 objetivas de múltipla escolha + 2 discursivas) adequadas para avaliação escolar.\n\n' +
      'TEXTO BASE:\n"' + texto.trim().substring(0, 2500) + '"\n\n' +
      'Para cada questão objetiva: 4 alternativas (A-D) com gabarito indicado.\n' +
      'Para cada questão discursiva: critérios de avaliação (3 critérios, 10 pts).\n' +
      'Adapte o nível para o Ensino Fundamental/EJA.';
    const questoes = chamarGemini(prompt);
    registrarLog('INFO', 'Questões geradas via webapp', texto.length + ' chars');
    return { sucesso: true, questoes };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Corrige resposta discursiva a partir de texto explícito (versão webapp).
 * @param {string} respostaAluno
 * @param {string} enunciado
 * @param {string} codigoBNCC
 * @returns {{sucesso:boolean, nota_sugerida?, feedback_aluno?, observacao_professor?, mensagem?}}
 */
function corrigirTextoHTML(respostaAluno, enunciado, codigoBNCC) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    if (!respostaAluno || !enunciado || !codigoBNCC) {
      return { sucesso: false, mensagem: 'Preencha todos os campos obrigatórios.' };
    }
    const rubrica = 'Critérios: 1) Compreensão do enunciado (3 pts), 2) Desenvolvimento da resposta (4 pts), 3) Clareza e coesão textual (3 pts)';
    const resultado = avaliarDiscursiva(respostaAluno, enunciado, codigoBNCC.toUpperCase(), rubrica);
    registrarLog('INFO', 'Discursiva corrigida via webapp', 'BNCC: ' + codigoBNCC);
    return { sucesso: true, ...resultado };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Adapta conteúdo a partir de texto explícito (versão webapp — sem seleção de Docs).
 * @param {string} tipo - '1'=DI, '2'=TEA, '3'=EJA, '4'=Altas Habilidades
 * @param {string} texto
 * @returns {{sucesso:boolean, adaptado?:string, mensagem?:string}}
 */
function adaptarConteudoTextoHTML(tipo, texto) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    if (!texto || texto.trim().length < 20) {
      return { sucesso: false, mensagem: 'Forneça o conteúdo a adaptar.' };
    }
    const descricoes = {
      '1': 'Deficiência Intelectual: use linguagem simples, frases curtas, exemplos concretos e visuais',
      '2': 'TEA: estrutura clara, sem ambiguidades, sequência visual, previsibilidade',
      '3': 'EJA — Adultos: contexto de vida real, mundo do trabalho, valorize saberes prévios',
      '4': 'Altas Habilidades: enriquecimento curricular, aprofundamento, conexões interdisciplinares'
    };
    const prompt =
      'Adapte o conteúdo abaixo para: ' + (descricoes[tipo] || 'necessidade educacional especial') + '\n\n' +
      'CONTEÚDO ORIGINAL:\n"' + texto.trim() + '"\n\n' +
      'Mantenha os objetivos pedagógicos, mas torne o conteúdo acessível e adequado à necessidade indicada.';
    const adaptado = chamarGemini(prompt);
    registrarLog('INFO', 'Conteúdo adaptado via webapp', 'Tipo: ' + tipo);
    return { sucesso: true, adaptado };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

// ============================================================
// FERRAMENTA 1: GERAR QUESTÕES DA SELEÇÃO (Ctrl+Shift+Q)
// ============================================================

/**
 * Gera questões sobre o texto selecionado no Google Docs.
 */
function gerarQuestoesDaSelecao() {
  try {
    const doc = DocumentApp.getActiveDocument();
    const selecao = doc.getSelection();

    if (!selecao) {
      DocumentApp.getUi().alert(
        'Seleção necessária',
        'Selecione um trecho de texto no documento antes de gerar questões.',
        DocumentApp.getUi().ButtonSet.OK
      );
      return;
    }

    const textoSelecionado = selecao.getRangeElements()
      .map(el => el.getElement().asText ? el.getElement().asText().getText() : '')
      .join(' ').trim();

    if (textoSelecionado.length < 50) {
      DocumentApp.getUi().alert('Seleção muito pequena. Selecione pelo menos um parágrafo.');
      return;
    }

    const prompt = `Com base no seguinte texto, gere 5 questões variadas (3 objetivas de múltipla escolha + 2 discursivas) adequadas para avaliação escolar.

TEXTO BASE:
"${textoSelecionado.substring(0, 2000)}"

Para cada questão objetiva, forneça 4 alternativas (A, B, C, D) e indique o gabarito.
Para cada questão discursiva, forneça critérios básicos de avaliação.
Adapte o nível de complexidade para o Ensino Fundamental.`;

    const resposta = chamarGemini(prompt);

    // Inserir questões ao final do documento
    const body = doc.getBody();
    body.appendHorizontalRule();
    body.appendParagraph('QUESTÕES GERADAS PELO PEDAGOGO.AI').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(`Geradas em: ${dataHoje()}`).setItalic(true);
    body.appendParagraph(resposta);
    doc.saveAndClose();

    registrarLog('INFO', 'Questões geradas da seleção', `${textoSelecionado.length} chars`);
  } catch (e) {
    _mostrarErro('Erro ao gerar questões: ' + e.message);
  }
}

// ============================================================
// FERRAMENTA 2: PLANO DE AULA RÁPIDO (Ctrl+Shift+P)
// ============================================================

/**
 * Abre sidebar para geração rápida de plano de aula.
 */
function planoDeAulaRapido() {
  try {
    const ui = _obterUI();
    const resposta = ui.prompt(
      '📝 Plano de Aula Rápido — PEDAGOGO.AI',
      'Informe os dados separados por | (barra vertical):\n\n' +
      'Componente | Ano/Série | Turma | Habilidade BNCC | Tema\n\n' +
      'Exemplo: Matemática | 7º Ano | 7A | EF07MA18 | Porcentagem no cotidiano',
      ui.ButtonSet.OK_CANCEL
    );

    if (resposta.getSelectedButton() !== ui.Button.OK) return;
    const texto = resposta.getResponseText().trim();
    if (!texto) return;

    const partes = texto.split('|').map(p => p.trim());
    if (partes.length < 5) {
      ui.alert('Informe todos os 5 campos separados por |');
      return;
    }

    const dados = {
      componente:       partes[0],
      ano:              partes[1],
      turma:            partes[2],
      codigoHabilidade: partes[3].toUpperCase(),
      tema:             partes[4],
      duracao:          50,
      isEJA:            partes[1].toUpperCase().includes('EJA'),
      possuiNEE:        false,
      recursos:         ['lousa', 'quadro branco']
    };

    const url = gerarPlanoDeAula(dados);
    ui.alert(
      'Plano Gerado!',
      `Seu plano de aula foi gerado com sucesso!\n\nAcesse: ${url}`,
      ui.ButtonSet.OK
    );
  } catch (e) {
    _mostrarErro('Erro ao gerar plano: ' + e.message);
  }
}

// ============================================================
// FERRAMENTA 3: CORRIGIR SELECIONADO (Ctrl+Shift+C)
// ============================================================

/**
 * Avalia texto selecionado como resposta discursiva de aluno.
 */
function corrigirSelecionado() {
  try {
    const doc = DocumentApp.getActiveDocument();
    const selecao = doc.getSelection();

    if (!selecao) {
      DocumentApp.getUi().alert('Selecione a resposta do aluno antes de corrigir.');
      return;
    }

    const respostaAluno = selecao.getRangeElements()
      .map(el => el.getElement().asText ? el.getElement().asText().getText() : '')
      .join(' ').trim();

    const ui = DocumentApp.getUi();
    const promptEnunciado = ui.prompt(
      'Correção de Resposta Discursiva',
      'Cole o enunciado da questão:',
      ui.ButtonSet.OK_CANCEL
    );
    if (promptEnunciado.getSelectedButton() !== ui.Button.OK) return;

    const promptCodigo = ui.prompt(
      'Correção de Resposta Discursiva',
      'Código BNCC da habilidade avaliada (ex: EF08LP04):',
      ui.ButtonSet.OK_CANCEL
    );
    if (promptCodigo.getSelectedButton() !== ui.Button.OK) return;

    const codigoBNCC = promptCodigo.getResponseText().trim().toUpperCase();
    const rubricaPadrao = 'Critérios: 1) Compreensão do enunciado (3pts), 2) Desenvolvimento da resposta (4pts), 3) Clareza e coesão textual (3pts)';

    const resultado = avaliarDiscursiva(
      respostaAluno,
      promptEnunciado.getResponseText(),
      codigoBNCC,
      rubricaPadrao
    );

    // Adicionar feedback ao documento
    const body = doc.getBody();
    body.appendHorizontalRule();
    body.appendParagraph('FEEDBACK DO PEDAGOGO.AI (Revisão Humana Necessária)').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph(`⚠️ Esta avaliação requer confirmação do professor antes de ser lançada.`).setBold(true);
    body.appendParagraph(`Nota sugerida: ${resultado.nota_sugerida}/10`).setBold(true);
    body.appendParagraph(`Feedback para o aluno:\n${resultado.feedback_aluno}`);
    body.appendParagraph(`Observação para o professor:\n${resultado.observacao_professor}`).setItalic(true);

    doc.saveAndClose();
    registrarLog('INFO', 'Discursiva avaliada via menu', `BNCC: ${codigoBNCC}`);
  } catch (e) {
    _mostrarErro('Erro na correção: ' + e.message);
  }
}

// ============================================================
// FERRAMENTA 4: ADAPTAR PARA NEE/EJA
// ============================================================

function adaptarParaNEE() {
  try {
    const doc = DocumentApp.getActiveDocument();
    const selecao = doc.getSelection();
    if (!selecao) {
      DocumentApp.getUi().alert('Selecione o conteúdo a adaptar.');
      return;
    }

    const textoOriginal = selecao.getRangeElements()
      .map(el => el.getElement().asText ? el.getElement().asText().getText() : '')
      .join(' ').trim();

    const ui = DocumentApp.getUi();
    const tipoAdaptacao = ui.prompt(
      'Adaptar Conteúdo',
      'Para qual necessidade adaptar?\n1. NEE — Deficiência Intelectual (DI)\n2. NEE — TEA\n3. EJA — Adultos\n4. Altas Habilidades\n\nDigite o número:',
      ui.ButtonSet.OK_CANCEL
    );
    if (tipoAdaptacao.getSelectedButton() !== ui.Button.OK) return;

    const tipo = tipoAdaptacao.getResponseText().trim();
    const descricoes = {
      '1': 'Deficiência Intelectual: use linguagem simples, frases curtas, exemplos concretos e visuais',
      '2': 'TEA: estrutura clara, sem ambiguidades, sequência visual, previsibilidade',
      '3': 'EJA — Adultos: contexto de vida real, mundo do trabalho, valorize saberes prévios',
      '4': 'Altas Habilidades: enriquecimento curricular, aprofundamento, conexões interdisciplinares'
    };

    const prompt = `Adapte o conteúdo abaixo para: ${descricoes[tipo] || 'necessidade educacional especial'}

CONTEÚDO ORIGINAL:
"${textoOriginal}"

Mantenha os objetivos pedagógicos, mas torne o conteúdo acessível e adequado à necessidade indicada.`;

    const adaptado = chamarGemini(prompt);

    const body = doc.getBody();
    body.appendHorizontalRule();
    body.appendParagraph('VERSÃO ADAPTADA — PEDAGOGO.AI').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph(adaptado);
    doc.saveAndClose();
  } catch (e) {
    _mostrarErro('Erro na adaptação: ' + e.message);
  }
}

// ============================================================
// FERRAMENTA 5: RELATÓRIO DA TURMA
// ============================================================

function gerarRelatorioTurmaDocs() {
  try {
    const ui = _obterUI();
    const resposta = ui.prompt(
      'Relatório da Turma',
      'Informe: Turma | Componente | Bimestre\nEx: 7A | Matemática | 1B_2026',
      ui.ButtonSet.OK_CANCEL
    );
    if (resposta.getSelectedButton() !== ui.Button.OK) return;

    const partes = resposta.getResponseText().split('|').map(p => p.trim());
    if (partes.length < 3) { ui.alert('Preencha todos os 3 campos.'); return; }

    gerarRelatorioTurma(partes[0], partes[1], partes[2]);
    ui.alert('Relatório gerado! Verifique a pasta 03_RESULTADOS no Drive.');
  } catch (e) {
    _mostrarErro('Erro ao gerar relatório: ' + e.message);
  }
}

// ============================================================
// FERRAMENTA 6: COMUNICADO PARA FAMÍLIA
// ============================================================

function redigirComunicadoFamilia() {
  try {
    const ui = _obterUI();
    const resposta = ui.prompt(
      '📧 Comunicado para Família',
      'Descreva o motivo do comunicado:\n(Ex: frequência crítica, baixo desempenho, reunião de pais)',
      ui.ButtonSet.OK_CANCEL
    );
    if (resposta.getSelectedButton() !== ui.Button.OK) return;

    const prompt = `Redija um comunicado escolar cordial e respeitoso para a família de um aluno.

MOTIVO: ${resposta.getResponseText()}
ESCOLA: Colégio Municipal de Itabatan — Mucuri-BA

O comunicado deve:
• Ser escrito em tom acolhedor e não punitivo
• Explicar a situação com clareza
• Propor parceria escola-família
• Incluir local e data (___/___/2026) e campo para assinatura do responsável
• Máximo 15 linhas`;

    const comunicado = chamarGemini(prompt);

    // Salvar como Google Doc
    const config = getConfig();
    const titulo = `Comunicado_Familia_${timestampArquivo()}`;
    const doc = DocumentApp.create(titulo);
    const body = doc.getBody();

    body.appendParagraph(config.ESCOLA).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(config.SECRETARIA).setItalic(true);
    body.appendHorizontalRule();
    body.appendParagraph('COMUNICADO AOS PAIS/RESPONSÁVEIS').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph(comunicado);
    doc.saveAndClose();

    // Mover para pasta de planejamento (BUG-04: usar moveTo)
    try {
      const idPlanejamento = config.DRIVE.PLANEJAMENTO;
      if (idPlanejamento) {
        const pastaPlan = DriveApp.getFolderById(idPlanejamento);
        const pastaTemplates = buscarOuCriarPasta('Templates', pastaPlan);
        DriveApp.getFileById(doc.getId()).moveTo(pastaTemplates);
      }
    } catch (e) {}

    ui.alert('Comunicado Gerado!', `O comunicado foi salvo como documento:\n${doc.getUrl()}`, ui.ButtonSet.OK);
    registrarLog('INFO', 'Comunicado para família gerado e salvo como Doc');
  } catch (e) {
    _mostrarErro('Erro: ' + e.message);
  }
}

// ============================================================
// FERRAMENTA 7: DIAGNÓSTICO FORMATIVO
// ============================================================

function criarDiagnosticoFormativo() {
  try {
    const ui = _obterUI();
    const resposta = ui.prompt(
      '🎯 Diagnóstico Formativo',
      'Informe: Componente | Ano/Série | Habilidade BNCC\nEx: Ciências | 8º Ano | EF08CI07',
      ui.ButtonSet.OK_CANCEL
    );
    if (resposta.getSelectedButton() !== ui.Button.OK) return;

    const partes = resposta.getResponseText().split('|').map(p => p.trim());
    if (partes.length < 3) { ui.alert('Preencha todos os 3 campos.'); return; }

    const habilidade = buscarHabilidadeBNCC(partes[2].toUpperCase());
    const prompt = `Crie uma sondagem diagnóstica com 5 questões rápidas para ${partes[0]}, ${partes[1]}.

HABILIDADE BNCC: ${habilidade.codigo} — ${habilidade.descricao}

As questões devem:
• Verificar conhecimentos prévios sobre a habilidade
• Ser variadas (2 objetivas + 2 dissertativas curtas + 1 prática/reflexão)
• Levar no máximo 15 minutos para responder
• Ter gabarito ou critérios de avaliação ao final`;

    const diagnostico = chamarGemini(prompt);
    ui.alert('Diagnóstico Gerado', 'O diagnóstico foi gerado. Verifique o documento.', ui.ButtonSet.OK);

    // Criar novo documento com o diagnóstico
    const doc = DocumentApp.create(`Diagnóstico_${partes[2]}_${partes[1]}`);
    doc.getBody().appendParagraph(diagnostico);
    doc.saveAndClose();
  } catch (e) {
    _mostrarErro('Erro: ' + e.message);
  }
}

// ============================================================
// FERRAMENTA 8: PAUTA DE CONSELHO DE CLASSE
// ============================================================

function gerarPautaReuniao() {
  try {
    const ui = _obterUI();
    const resposta = ui.prompt(
      '📋 Pauta de Conselho de Classe',
      'Informe: Turma | Bimestre\nEx: 6A | 2B_2026',
      ui.ButtonSet.OK_CANCEL
    );
    if (resposta.getSelectedButton() !== ui.Button.OK) return;

    const partes = resposta.getResponseText().split('|').map(p => p.trim());
    if (partes.length < 2) { ui.alert('Informe Turma e Bimestre.'); return; }

    const prompt = `Estruture uma pauta completa para o Conselho de Classe da turma ${partes[0]}, ${partes[1]}.

A pauta deve incluir:
1. Abertura e apresentação dos participantes (5 min)
2. Análise dos resultados acadêmicos por componente (15 min)
3. Discussão sobre alunos em situação de atenção (15 min)
4. Frequência e estratégias para alunos com risco de reprovação (10 min)
5. Propostas de intervenção pedagógica coletiva (10 min)
6. Encaminhamentos e responsáveis (5 min)
7. Próximos passos e data do próximo conselho (5 min)

Escola: Colégio Municipal de Itabatan | SEME/Mucuri-BA
Data: ___/___/2026 | Horário: _____`;

    const pauta = chamarGemini(prompt);
    const doc = DocumentApp.create(`Pauta_Conselho_${partes[0]}_${partes[1]}`);
    doc.getBody().appendParagraph(pauta);
    doc.saveAndClose();

    ui.alert('Pauta criada! Verifique o novo documento no Drive.');
  } catch (e) {
    _mostrarErro('Erro: ' + e.message);
  }
}

// ============================================================
// UTILITÁRIOS DO MENU
// ============================================================

function executarDiagnosticoUI() {
  try {
    const html = HtmlService.createTemplateFromFile('DiagnosticoModal')
      .evaluate()
      .setWidth(600)
      .setHeight(500)
      .setTitle('Diagnóstico do Sistema — PEDAGOGO.AI');
    _obterUI().showModalDialog(html, 'Diagnóstico do Sistema — PEDAGOGO.AI');
  } catch(e) {
    // Fallback para o modo texto se HtmlService falhar
    const relatorio = diagnosticarSistema();
    const ui = _obterUI();
    const status = relatorio.resumo.critico > 0 ? '🔴 CRÍTICO' :
                   relatorio.resumo.atencao > 0 ? '🟡 ATENÇÃO' : '🟢 OK';
    ui.alert(
      `Diagnóstico do Sistema — ${status}`,
      `✅ OK: ${relatorio.resumo.ok} | ⚠️ Atenção: ${relatorio.resumo.atencao} | 🚨 Crítico: ${relatorio.resumo.critico}\n\n` +
      `Veja o Logs_Sistema.txt em 05_CONFIGURACOES para detalhes.`,
      ui.ButtonSet.OK
    );
  }
}

function abrirPastaPedagogo() {
  const config = getConfig();
  const id = config.DRIVE.ROOT;
  if (!id) { _mostrarErro('Pasta PEDAGOGO.AI não configurada. Execute o Setup.'); return; }
  DriveApp.getFolderById(id);  // valida acesso à pasta antes de exibir a URL
  const url = `https://drive.google.com/drive/folders/${id}`;
  _obterUI().alert('Pasta PEDAGOGO.AI', `URL da pasta:\n${url}`, _obterUI().ButtonSet.OK);
}

function mostrarSobre() {
  _obterUI().alert(
    'PEDAGOGO.AI — v2.0',
    'Sistema de Automação Pedagógica\nColégio Municipal de Itabatan | SEME/Mucuri-BA\n\n' +
    'Desenvolvido com Google Workspace for Education + Gemini AI\n\n' +
    'Módulos: Planos de Aula | Banco de Questões | Correção Automática\n' +
    'Frequência | Relatórios | Dashboard | Pastas por Professor | LGPD Compliance\n\n' +
    'v2.0 — Sprint 3 (Pastas Professor) | Sprint 4 (BNCC EI/EM/EJA)',
    _obterUI().ButtonSet.OK
  );
}

function _obterUI() {
  try { return DocumentApp.getUi(); } catch(e) {}
  try { return SpreadsheetApp.getUi(); } catch(e) {}
  throw new Error('UI não disponível');
}

function _mostrarErro(mensagem) {
  registrarLog('ERRO', mensagem);
  try { _obterUI().alert('Erro', mensagem, _obterUI().ButtonSet.OK); } catch(e) {}
}

// ============================================================
// FERRAMENTA 9: GERAR PEI/PDI (NEE) via Menu
// ============================================================

function gerarPEIViaMenu() {
  try {
    const ui = _obterUI();
    const resposta = ui.prompt(
      '📝 Gerar PEI/PDI para Aluno com NEE',
      'Informe: Nome do Aluno | Turma | Tipo NEE | Componentes\n' +
      'Ex: João Silva | 6A | TEA | Língua Portuguesa, Matemática\n\n' +
      'Tipos NEE: TEA, DI, DA, DF, TDAH, Altas_Habilidades',
      ui.ButtonSet.OK_CANCEL
    );
    if (resposta.getSelectedButton() !== ui.Button.OK) return;

    const partes = resposta.getResponseText().split('|').map(p => p.trim());
    if (partes.length < 3) {
      ui.alert('Informe pelo menos: Nome | Turma | Tipo NEE');
      return;
    }

    const componentes = partes.length > 3
      ? partes[3].split(',').map(c => c.trim())
      : ['Todos'];

    const url = gerarPEI({
      nomeCompleto: partes[0],
      turma:        partes[1],
      segmento:     partes[1].toUpperCase().includes('EJA') ? 'EJA Segmento II' : 'EF II',
      tipoNEE:      partes[2],
      componentes:  componentes,
      isEJA:        partes[1].toUpperCase().includes('EJA')
    });

    ui.alert('PEI Gerado!', `O PEI foi gerado e salvo em 04_ALUNOS/PEI_PDI/\n\n${url}`, ui.ButtonSet.OK);
  } catch (e) {
    _mostrarErro('Erro ao gerar PEI: ' + e.message);
  }
}

// ============================================================
// FERRAMENTA 10: CRIAR PROVA DIGITAL (Forms) via Menu
// ============================================================

function criarProvaDigitalViaMenu() {
  try {
    const ui = _obterUI();
    const resposta = ui.prompt(
      '📄 Criar Prova Digital (Google Forms)',
      'Informe o ID do Gabarito da prova:\n\n' +
      '(Encontre o ID na planilha BANCO_QUESTOES, aba Gabaritos, coluna A)\n' +
      'Opcionalmente adicione prazo: ID_GABARITO | dd/MM/yyyy',
      ui.ButtonSet.OK_CANCEL
    );
    if (resposta.getSelectedButton() !== ui.Button.OK) return;

    const partes = resposta.getResponseText().split('|').map(p => p.trim());
    const idGabarito = partes[0];
    const prazo = partes.length > 1 ? partes[1] : null;

    if (!idGabarito) { ui.alert('Informe o ID do gabarito.'); return; }

    const resultado = criarProvaDigital(idGabarito, { prazo: prazo });

    ui.alert(
      'Prova Digital Criada!',
      `O Google Form da prova foi criado com sucesso!\n\n` +
      `📋 URL para alunos: ${resultado.urlForm}\n` +
      `✏️ URL para editar: ${resultado.urlEditar}\n\n` +
      `Compartilhe o link com os alunos via Google Classroom ou WhatsApp.`,
      ui.ButtonSet.OK
    );
  } catch (e) {
    _mostrarErro('Erro ao criar prova digital: ' + e.message);
  }
}

// ============================================================
// FERRAMENTA 11: CORRIGIR LOTE DE REDAÇÕES via Menu
// ============================================================

function corrigirLoteViaMenu() {
  try {
    const ui = _obterUI();

    const respPasta = ui.prompt(
      '📚 Correção em Lote de Redações',
      'Informe o ID da pasta no Drive contendo os documentos dos alunos:\n\n' +
      '(Cada documento deve conter a redação de um aluno.\n' +
      'Padrão de nome: "Redação — Nome do Aluno")',
      ui.ButtonSet.OK_CANCEL
    );
    if (respPasta.getSelectedButton() !== ui.Button.OK) return;

    const pastaId = respPasta.getResponseText().trim();
    if (!pastaId) { ui.alert('Informe o ID da pasta.'); return; }

    const respEnunciado = ui.prompt(
      'Correção em Lote',
      'Cole o enunciado da atividade/questão:',
      ui.ButtonSet.OK_CANCEL
    );
    if (respEnunciado.getSelectedButton() !== ui.Button.OK) return;

    const respCodigo = ui.prompt(
      'Correção em Lote',
      'Código BNCC da habilidade avaliada (ex: EF08LP04):',
      ui.ButtonSet.OK_CANCEL
    );
    if (respCodigo.getSelectedButton() !== ui.Button.OK) return;

    const codigoBNCC = respCodigo.getResponseText().trim().toUpperCase();
    const rubricaPadrao = 'Critérios: 1) Compreensão do tema (3pts), 2) Desenvolvimento e argumentação (4pts), 3) Clareza e coesão textual (3pts)';

    const resultado = corrigirLoteRedacoes(
      pastaId,
      respEnunciado.getResponseText(),
      codigoBNCC,
      rubricaPadrao
    );

    ui.alert(
      'Correção em Lote Concluída!',
      `${resultado.totalCorrigidos} redações corrigidas\n` +
      `${resultado.totalErros} erros\n\n` +
      `⚠️ TODAS as notas são SUGESTÕES e requerem validação do professor.\n\n` +
      `Relatório: ${resultado.urlRelatorio}`,
      ui.ButtonSet.OK
    );
  } catch (e) {
    _mostrarErro('Erro na correção em lote: ' + e.message);
  }
}

// ============================================================
// HTMLSERVICE — TEMPLATE INCLUDE
// ============================================================

/**
 * Inclui conteúdo de um arquivo HTML (CSS.html, JS.html) em um template.
 * Usado como <?!= include('CSS') ?> nos arquivos .html
 * @param {string} filename - Nome do arquivo sem extensão
 * @returns {string} Conteúdo HTML do arquivo
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================
// SIDEBAR — PAINEL PRINCIPAL
// ============================================================

/**
 * Abre a sidebar do PEDAGOGO.AI no Google Docs ou Sheets.
 */
function abrirSidebar() {
  const html = HtmlService.createTemplateFromFile('Sidebar')
    .evaluate()
    .setTitle('🤖 PEDAGOGO.AI')
    .setWidth(320);
  _obterUI().showSidebar(html);
}

// ============================================================
// SETUP WIZARD — MODAL HTML
// ============================================================

/**
 * Abre o wizard de setup em modal HTML.
 */
function abrirSetupWizard() {
  const html = HtmlService.createTemplateFromFile('SetupWizard')
    .evaluate()
    .setWidth(700)
    .setHeight(550)
    .setTitle('Setup — PEDAGOGO.AI');
  _obterUI().showModalDialog(html, 'Setup — PEDAGOGO.AI');
}

/**
 * Executa uma etapa individual do setup para o wizard HTML.
 * @param {number} etapa - Número da etapa (1-6)
 * @returns {Object} Resultado da etapa
 */
function executarEtapaSetup(etapa) {
  switch (etapa) {
    case 1: {
      const prereq = verificarPreRequisitos();
      return { ok: true, geminiOk: prereq.geminiOk };
    }
    case 2: {
      const pastas = criarEstruturaPastas();
      registrarLog('INFO', 'Estrutura de pastas criada', JSON.stringify(pastas));
      return { ok: true, pastas: pastas };
    }
    case 3: {
      const planilhas = criarPlanilhasMestre();
      return { ok: true, planilhas: planilhas };
    }
    case 4: {
      const cfg = getConfig();
      configurarProtecoesLGPD(cfg.SHEETS.TURMAS_ALUNOS);
      return { ok: true };
    }
    case 5: {
      instalarTriggers();
      return { ok: true };
    }
    case 6: {
      const urlForm = criarFormPlanoDeAula();
      try { criarPastasParaTodosProfessores(); } catch(e) {
        registrarLog('ALERTA', 'Pastas de professores: ' + e.message);
      }
      salvarPropriedade('DATA_INSTALACAO', formatarData(new Date(), 'dd/MM/yyyy HH:mm:ss'));
      salvarPropriedade('VERSAO_SISTEMA', '2.0');
      registrarLog('INFO', 'Setup v2.0 concluído via wizard HTML');
      return { ok: true, urlFormPlano: urlForm };
    }
    default:
      throw new Error('Etapa inválida: ' + etapa);
  }
}

// ============================================================
// WRAPPERS SERVER-SIDE PARA A SIDEBAR HTML
// ============================================================

/**
 * Lista turmas ativas para popular selects na sidebar.
 * @returns {string[]} Array de nomes de turmas
 */
function listarTurmasAtivasHTML() {
  try {
    const config = getConfig();
    if (!config.SHEETS.TURMAS_ALUNOS) return [];
    const dados = lerAba(config.SHEETS.TURMAS_ALUNOS, ABAS.TURMAS_ALUNOS.TURMAS);
    // BUG-01: usar estaAtivo() para normalizar TRUE/true/1/Sim/Ativo
    return dados.slice(1)
      .filter(t => estaAtivo(t[7]))
      .map(t => ({
        valor: String(t[0]).trim(),                         // Codigo_Turma ('7A') — usado em lookups
        texto: String(t[1] || t[0]).trim()                 // Nome_Turma ('7º Ano A') — exibido no select
      }))
      .filter(t => t.valor);
  } catch (e) {
    return [];
  }
}

/**
 * Obtém o texto selecionado no Google Docs.
 * @returns {string|null} Texto selecionado ou null
 */
function obterTextoSelecionado() {
  try {
    const doc = DocumentApp.getActiveDocument();
    const selecao = doc.getSelection();
    if (!selecao) return null;
    return selecao.getRangeElements()
      .map(el => el.getElement().asText ? el.getElement().asText().getText() : '')
      .join(' ').trim();
  } catch (e) {
    return null;
  }
}

/** Gerar questões da seleção — versão HTML */
function gerarQuestoesDaSelecaoHTML() {
  try {
    const texto = obterTextoSelecionado();
    if (!texto || texto.length < 50) {
      return { sucesso: false, mensagem: 'Selecione um trecho de texto com pelo menos um parágrafo.' };
    }

    const prompt = `Com base no seguinte texto, gere 5 questões variadas (3 objetivas de múltipla escolha + 2 discursivas) adequadas para avaliação escolar.

TEXTO BASE:
"${texto.substring(0, 2000)}"

Para cada questão objetiva, forneça 4 alternativas (A, B, C, D) e indique o gabarito.
Para cada questão discursiva, forneça critérios básicos de avaliação.
Adapte o nível de complexidade para o Ensino Fundamental.`;

    const resposta = chamarGemini(prompt);
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    body.appendHorizontalRule();
    body.appendParagraph('QUESTÕES GERADAS PELO PEDAGOGO.AI').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(`Geradas em: ${dataHoje()}`).setItalic(true);
    body.appendParagraph(resposta);
    doc.saveAndClose();
    registrarLog('INFO', 'Questões geradas via sidebar', `${texto.length} chars`);
    return { sucesso: true };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/** Gerar plano de aula — versão HTML */
function gerarPlanoDeAulaHTML(dados) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    if (!dados || !dados.codigoHabilidade) {
      return { erro: true, mensagem: 'Preencha todos os campos obrigatórios.' };
    }
    dados.codigoHabilidade = dados.codigoHabilidade.toUpperCase();
    // Converter número de aulas (1–10) para minutos (50min cada)
    dados.duracao = (parseInt(dados.duracao) || 1) * 50;
    if (!dados.recursos || dados.recursos.length === 0) {
      dados.recursos = ['lousa', 'quadro branco'];
    }
    const url = gerarPlanoDeAula(dados);
    return { url: url };
  } catch (e) {
    registrarLog('ERRO', 'gerarPlanoDeAulaHTML: ' + e.message);
    return { erro: true, mensagem: e.message };
  }
}

/** Corrigir selecionado — versão HTML */
function corrigirSelecionadoHTML(dados) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    const respostaAluno = obterTextoSelecionado();
    if (!respostaAluno) {
      return { sucesso: false, mensagem: 'Selecione a resposta do aluno no documento antes de corrigir.' };
    }

    const codigoBNCC = dados.codigoBNCC.toUpperCase();
    const rubricaPadrao = 'Critérios: 1) Compreensão do enunciado (3pts), 2) Desenvolvimento da resposta (4pts), 3) Clareza e coesão textual (3pts)';

    const resultado = avaliarDiscursiva(respostaAluno, dados.enunciado, codigoBNCC, rubricaPadrao);

    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    body.appendHorizontalRule();
    body.appendParagraph('FEEDBACK DO PEDAGOGO.AI (Revisão Humana Necessária)').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph('⚠️ Esta avaliação requer confirmação do professor antes de ser lançada.').setBold(true);
    body.appendParagraph(`Nota sugerida: ${resultado.nota_sugerida}/10`).setBold(true);
    body.appendParagraph(`Feedback para o aluno:\n${resultado.feedback_aluno}`);
    body.appendParagraph(`Observação para o professor:\n${resultado.observacao_professor}`).setItalic(true);
    doc.saveAndClose();
    registrarLog('INFO', 'Discursiva avaliada via sidebar', `BNCC: ${codigoBNCC}`);

    return {
      sucesso: true,
      nota: resultado.nota_sugerida,
      feedback: resultado.feedback_aluno
    };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/** Adaptar para NEE/EJA — versão HTML */
function adaptarParaNEEHTML(tipo) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    const textoOriginal = obterTextoSelecionado();
    if (!textoOriginal) {
      return { sucesso: false, mensagem: 'Selecione o conteúdo a adaptar no documento.' };
    }

    const descricoes = {
      '1': 'Deficiência Intelectual: use linguagem simples, frases curtas, exemplos concretos e visuais',
      '2': 'TEA: estrutura clara, sem ambiguidades, sequência visual, previsibilidade',
      '3': 'EJA — Adultos: contexto de vida real, mundo do trabalho, valorize saberes prévios',
      '4': 'Altas Habilidades: enriquecimento curricular, aprofundamento, conexões interdisciplinares'
    };

    const prompt = `Adapte o conteúdo abaixo para: ${descricoes[tipo] || 'necessidade educacional especial'}

CONTEÚDO ORIGINAL:
"${textoOriginal}"

Mantenha os objetivos pedagógicos, mas torne o conteúdo acessível e adequado à necessidade indicada.`;

    const adaptado = chamarGemini(prompt);
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    body.appendHorizontalRule();
    body.appendParagraph('VERSÃO ADAPTADA — PEDAGOGO.AI').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph(adaptado);
    doc.saveAndClose();
    return { sucesso: true };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/** Relatório da turma — versão HTML */
function gerarRelatorioTurmaHTML(turma, componente, bimestre) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    const resultado = gerarRelatorioTurma(turma, componente, bimestre);
    return {
      url: resultado.urlProfessor || '',
      urlPublico: resultado.urlPublico || ''
    };
  } catch (e) {
    registrarLog('ERRO', 'gerarRelatorioTurmaHTML: ' + e.message);
    return { erro: true, mensagem: e.message };
  }
}

/** Comunicado para família — versão HTML */
function redigirComunicadoFamiliaHTML(motivo) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    const prompt = `Redija um comunicado escolar cordial e respeitoso para a família de um aluno.

MOTIVO: ${motivo}
ESCOLA: Colégio Municipal de Itabatan — Mucuri-BA

O comunicado deve:
• Ser escrito em tom acolhedor e não punitivo
• Explicar a situação com clareza
• Propor parceria escola-família
• Incluir local e data (___/___/2026) e campo para assinatura do responsável
• Máximo 15 linhas`;

    const comunicado = chamarGemini(prompt);
    const config = getConfig();
    const titulo = `Comunicado_Familia_${timestampArquivo()}`;
    const doc = DocumentApp.create(titulo);
    const body = doc.getBody();

    body.appendParagraph(config.ESCOLA).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(config.SECRETARIA).setItalic(true);
    body.appendHorizontalRule();
    body.appendParagraph('COMUNICADO AOS PAIS/RESPONSÁVEIS').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph(comunicado);
    doc.saveAndClose();

    // BUG-04: usar moveTo em vez de addFile/removeFile
    try {
      const idPlanejamento = config.DRIVE.PLANEJAMENTO;
      if (idPlanejamento) {
        const pastaPlan = DriveApp.getFolderById(idPlanejamento);
        const pastaTemplates = buscarOuCriarPasta('Templates', pastaPlan);
        DriveApp.getFileById(doc.getId()).moveTo(pastaTemplates);
      }
    } catch (_) {}

    registrarLog('INFO', 'Comunicado para família gerado via sidebar');
    return { url: doc.getUrl() };
  } catch (e) {
    registrarLog('ERRO', 'redigirComunicadoFamiliaHTML: ' + e.message);
    return { erro: true, mensagem: e.message };
  }
}

/** Diagnóstico formativo — versão HTML */
function criarDiagnosticoFormativoHTML(componente, ano, bncc) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    if (!componente || !ano || !bncc) {
      return { erro: true, mensagem: 'Preencha todos os campos obrigatórios.' };
    }
    const habilidade = buscarHabilidadeBNCC(bncc.toUpperCase());
    const prompt = `Crie uma sondagem diagnóstica com 5 questões rápidas para ${componente}, ${ano}.

HABILIDADE BNCC: ${habilidade.codigo} — ${habilidade.descricao}

As questões devem:
• Verificar conhecimentos prévios sobre a habilidade
• Ser variadas (2 objetivas + 2 dissertativas curtas + 1 prática/reflexão)
• Levar no máximo 15 minutos para responder
• Ter gabarito ou critérios de avaliação ao final`;

    const diagnostico = chamarGemini(prompt);
    const doc = DocumentApp.create(`Diagnóstico_${bncc}_${ano}`);
    doc.getBody().appendParagraph(diagnostico);
    doc.saveAndClose();

    // BUG-04: usar moveTo em vez de addFile/removeFile
    try {
      const config = getConfig();
      const idPlanejamento = config.DRIVE.PLANEJAMENTO;
      if (idPlanejamento) {
        DriveApp.getFileById(doc.getId()).moveTo(DriveApp.getFolderById(idPlanejamento));
      }
    } catch (_) {}

    return { url: doc.getUrl() };
  } catch (e) {
    registrarLog('ERRO', 'criarDiagnosticoFormativoHTML: ' + e.message);
    return { erro: true, mensagem: e.message };
  }
}

/** Pauta de conselho — versão HTML */
function gerarPautaReuniaoHTML(turma, bimestre) {
  try {
    verificarPermissao(PAPEIS.COORDENADOR);
    if (!turma || !bimestre) {
      return { erro: true, mensagem: 'Selecione a turma e o bimestre.' };
    }
    const prompt = `Estruture uma pauta completa para o Conselho de Classe da turma ${turma}, ${bimestre}.

A pauta deve incluir:
1. Abertura e apresentação dos participantes (5 min)
2. Análise dos resultados acadêmicos por componente (15 min)
3. Discussão sobre alunos em situação de atenção (15 min)
4. Frequência e estratégias para alunos com risco de reprovação (10 min)
5. Propostas de intervenção pedagógica coletiva (10 min)
6. Encaminhamentos e responsáveis (5 min)
7. Próximos passos e data do próximo conselho (5 min)

Escola: Colégio Municipal de Itabatan | SEME/Mucuri-BA
Data: ___/___/2026 | Horário: _____`;

    const pauta = chamarGemini(prompt);
    const doc = DocumentApp.create(`Pauta_Conselho_${turma}_${bimestre}`);
    doc.getBody().appendParagraph(pauta);
    doc.saveAndClose();

    // BUG-04: usar moveTo em vez de addFile/removeFile
    try {
      const config = getConfig();
      const idPlanejamento = config.DRIVE.PLANEJAMENTO;
      if (idPlanejamento) {
        DriveApp.getFileById(doc.getId()).moveTo(DriveApp.getFolderById(idPlanejamento));
      }
    } catch (_) {}

    return { url: doc.getUrl() };
  } catch (e) {
    registrarLog('ERRO', 'gerarPautaReuniaoHTML: ' + e.message);
    return { erro: true, mensagem: e.message };
  }
}

/** Gerar PEI — versão HTML
 *  CRÍTICO-06: verificar permissão antes de gerar PEI (dados LGPD sensíveis)
 */
function gerarPEIHTML(dados) {
  try {
    // CRÍTICO-06: acesso a dados de saúde/NEE requer papel mínimo de professor
    verificarPermissao(PAPEIS.PROFESSOR);
    registrarAuditoria('ESCRITA', 'PEI_PDI', `Geração via webapp por ${getUsuarioAtivo()}`);
    const url = _gerarPEISemPermissao(dados);
    return { url: url };
  } catch (e) {
    registrarLog('ERRO', 'gerarPEIHTML: ' + e.message);
    return { erro: true, mensagem: e.message };
  }
}

/** Criar prova digital — versão HTML */
function criarProvaDigitalHTML(idGabarito, prazo) {
  try {
    const resultado = criarProvaDigital(idGabarito, { prazo: prazo });
    return { urlForm: resultado.urlForm, urlEditar: resultado.urlEditar };
  } catch (e) {
    registrarLog('ERRO', 'criarProvaDigitalHTML: ' + e.message);
    return { erro: true, mensagem: e.message };
  }
}

/** Corrigir lote — versão HTML */
function corrigirLoteHTML(pastaId, enunciado, codigoBNCC) {
  try {
    if (!pastaId || !enunciado || !codigoBNCC) {
      return { erro: true, mensagem: 'Preencha todos os campos.' };
    }
    const rubricaPadrao = 'Critérios: 1) Compreensão do tema (3pts), 2) Desenvolvimento e argumentação (4pts), 3) Clareza e coesão textual (3pts)';
    const resultado = corrigirLoteRedacoes(pastaId, enunciado, codigoBNCC.toUpperCase(), rubricaPadrao);
    return {
      totalCorrigidos: resultado.totalCorrigidos,
      totalErros: resultado.totalErros,
      urlRelatorio: resultado.urlRelatorio
    };
  } catch (e) {
    registrarLog('ERRO', 'corrigirLoteHTML: ' + e.message);
    return { erro: true, mensagem: e.message };
  }
}

/** Diagnóstico do sistema — versão HTML */
function executarDiagnosticoHTML() {
  return diagnosticarSistema();
}

/** Obter URL da pasta PEDAGOGO.AI */
function obterUrlPastaHTML() {
  const config = getConfig();
  const id = config.DRIVE.ROOT;
  if (!id) return null;
  return `https://drive.google.com/drive/folders/${id}`;
}

// ============================================================
// CONFIGURAÇÕES DO SISTEMA — fontes HTML
// ============================================================

/**
 * Retorna o status atual da configuração para exibição na sidebar.
 * Nenhuma chave é exposta — apenas se está configurada ou não.
 * @returns {Object} Status de cada componente
 */
function obterStatusConfiguracaoHTML() {
  const config = getConfig();
  const props  = PropertiesService.getScriptProperties();

  const geminiKey = props.getProperty('GEMINI_KEY');
  let bnccCount = 0;
  try {
    if (config.SHEETS.MASTER_BNCC) {
      const ss  = SpreadsheetApp.openById(config.SHEETS.MASTER_BNCC);
      const aba = ss.getSheetByName('Habilidades');
      bnccCount = aba ? Math.max(0, aba.getLastRow() - 1) : 0;
    }
  } catch (e) { /* planilha não acessível ainda */ }

  let turmasCount = 0;
  try {
    const turmas = listarTurmasAtivasHTML();
    turmasCount  = turmas.length;
  } catch (e) { /* planilha não acessível ainda */ }

  return {
    geminiKey:          !!geminiKey,
    emailCoordenacao:   !!(config.EMAIL.COORDENACAO),
    emailDirecao:       !!(config.EMAIL.DIRECAO),
    planilhaBNCC:       !!(config.SHEETS.MASTER_BNCC),
    planilhaTurmas:     !!(config.SHEETS.TURMAS_ALUNOS),
    planilhaQuestoes:   !!(config.SHEETS.BANCO_QUESTOES),
    planilhaResultados: !!(config.SHEETS.RESULTADOS),
    pastasConfiguradas: !!(config.DRIVE.ROOT),
    bnccCount:          bnccCount,
    turmasCount:        turmasCount
  };
}

/**
 * Salva as configurações via PropertiesService.
 * Valida e-mails antes de gravar. Nunca loga a GEMINI_KEY.
 *
 * @param {Object} dados - {geminiKey, emailCoordenacao, emailDirecao, emailSecretaria}
 * @returns {{sucesso: boolean, mensagem: string}}
 */
function salvarConfiguracoesHTML(dados) {
  try {
    if (!dados) return { sucesso: false, mensagem: 'Dados não fornecidos.' };

    const props = PropertiesService.getScriptProperties();
    const alteracoes = [];

    if (dados.geminiKey && dados.geminiKey.trim().length > 10) {
      props.setProperty('GEMINI_KEY', dados.geminiKey.trim());
      alteracoes.push('GEMINI_KEY');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (dados.emailCoordenacao && emailRegex.test(dados.emailCoordenacao.trim())) {
      props.setProperty('EMAIL_COORDENACAO', dados.emailCoordenacao.trim());
      alteracoes.push('EMAIL_COORDENACAO');
    } else if (dados.emailCoordenacao && dados.emailCoordenacao.trim()) {
      return { sucesso: false, mensagem: `E-mail de coordenação inválido: ${dados.emailCoordenacao}` };
    }

    if (dados.emailDirecao && emailRegex.test(dados.emailDirecao.trim())) {
      props.setProperty('EMAIL_DIRECAO', dados.emailDirecao.trim());
      alteracoes.push('EMAIL_DIRECAO');
    } else if (dados.emailDirecao && dados.emailDirecao.trim()) {
      return { sucesso: false, mensagem: `E-mail de direção inválido: ${dados.emailDirecao}` };
    }

    if (dados.emailSecretaria && emailRegex.test(dados.emailSecretaria.trim())) {
      props.setProperty('EMAIL_SECRETARIA', dados.emailSecretaria.trim());
      alteracoes.push('EMAIL_SECRETARIA');
    }

    if (alteracoes.length === 0) {
      return { sucesso: false, mensagem: 'Nenhuma configuração válida para salvar.' };
    }

    registrarLog('AUDITORIA', `Configurações salvas: ${alteracoes.join(', ')}`,
      'GEMINI_KEY omitida do log por segurança');
    return { sucesso: true, mensagem: `Configurações salvas: ${alteracoes.join(', ')}` };
  } catch (e) {
    registrarLog('ERRO', 'Falha ao salvar configurações: ' + e.message);
    return { sucesso: false, mensagem: 'Erro ao salvar: ' + e.message };
  }
}

/**
 * Executa o Setup Inicial completo via webapp (sem dependência de UI).
 * Cria pastas, planilhas, proteções LGPD e registra instalação.
 * @returns {{sucesso: boolean, mensagem: string}}
 */
function executarSetupCompletoHTML() {
  try {
    verificarPreRequisitos();
    criarEstruturaPastas();
    criarPlanilhasMestre();
    const cfg = getConfig();
    if (cfg.SHEETS.TURMAS_ALUNOS) {
      try { configurarProtecoesLGPD(cfg.SHEETS.TURMAS_ALUNOS); } catch(e) {}
    }
    try { instalarTriggers(); } catch(e) {
      registrarLog('ALERTA', 'Triggers não instalados: ' + e.message);
    }
    try { criarPastasParaTodosProfessores(); } catch(e) {
      registrarLog('ALERTA', 'Pastas de professores: ' + e.message);
    }
    salvarPropriedade('DATA_INSTALACAO', formatarData(new Date(), 'dd/MM/yyyy HH:mm:ss'));
    salvarPropriedade('VERSAO_SISTEMA', '2.0');
    registrarLog('INFO', 'Setup concluído via webapp');
    return { sucesso: true, mensagem: 'Setup concluído! Pastas e planilhas criadas no Drive.' };
  } catch (e) {
    registrarLog('ERRO', 'Falha no setup via webapp: ' + e.message);
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Testa a conexão com a API Gemini usando um prompt mínimo.
 * @returns {{sucesso: boolean, mensagem: string, latenciaMs: number}}
 */
function testarGeminiHTML() {
  const t0 = Date.now();
  const resultado = testarConexaoIA();
  return {
    sucesso:    resultado.sucesso,
    mensagem:   resultado.mensagem,
    latenciaMs: Date.now() - t0
  };
}

/**
 * Retorna a configuração atual de IA para a sidebar (chaves mascaradas).
 * @returns {Object}
 */
function getConfiguracaoIAHTML() {
  try {
    return getConfiguracaoIA();
  } catch (e) {
    registrarLog('ERRO', 'getConfiguracaoIAHTML: ' + e.message);
    return { erro: e.message };
  }
}

/**
 * Salva a configuração de provider de IA via sidebar.
 * @param {Object} dados
 * @returns {{sucesso: boolean, mensagem: string}}
 */
function salvarConfiguracaoIAHTML(dados) {
  try {
    if (!dados) return { sucesso: false, mensagem: 'Dados não fornecidos.' };
    salvarConfiguracaoIA(dados);
    const provider = getProvedorAtivo();
    return { sucesso: true, mensagem: `Provider "${_nomeExibicaoProvider(provider)}" configurado com sucesso.` };
  } catch (e) {
    registrarLog('ERRO', 'Erro ao salvar config IA: ' + e.message);
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Testa o provider de IA atualmente ativo.
 * @returns {{sucesso: boolean, provider: string, modelo: string, mensagem: string}}
 */
function testarProviderIAHTML() {
  return testarConexaoIA();
}

/**
 * Popula o catálogo BNCC via chamada da sidebar.
 * @returns {{sucesso: boolean, mensagem: string, inseridos: number}}
 */
/**
 * Importa habilidades BNCC de uma planilha Google Sheets externa.
 * Chamado via google.script.run da interface HTML.
 * @param {string} spreadsheetId - ID da planilha de origem
 * @returns {{sucesso, inseridos, pulados, total, mensagem}}
 */
function importarBNCCDePlanilhaHTML(spreadsheetId) {
  try {
    if (!String(spreadsheetId || '').trim()) {
      return { sucesso: false, mensagem: 'Informe o ID da planilha de origem.' };
    }
    const r = importarBNCCDeSpreadsheet(String(spreadsheetId).trim());
    return {
      sucesso:   true,
      inseridos: r.inseridos,
      pulados:   r.pulados,
      total:     r.total,
      mensagem:  `${r.inseridos} habilidade(s) importada(s). ${r.pulados} já existiam. Total lido: ${r.total}.`
    };
  } catch (e) {
    registrarLog('ERRO', 'Import BNCC planilha externa: ' + e.message);
    return { sucesso: false, mensagem: e.message };
  }
}

function popularBNCCHTML() {
  try {
    const resultado = popularBNCCInicial();
    return {
      sucesso:   true,
      mensagem:  `${resultado.inseridos} habilidades inseridas (${resultado.pulados} já existiam).`,
      inseridos: resultado.inseridos
    };
  } catch (e) {
    registrarLog('ERRO', 'Falha ao popular BNCC: ' + e.message);
    return { sucesso: false, mensagem: e.message, inseridos: 0 };
  }
}

/**
 * Insere turmas e alunos de teste via chamada da sidebar.
 * @returns {{sucesso: boolean, mensagem: string}}
 */
function popularDadosTesteHTML() {
  try {
    const resultado = popularTurmasTeste();
    return {
      sucesso:  true,
      mensagem: `${resultado.turmas} turma(s) e ${resultado.alunos} aluno(s) de teste inseridos.`
    };
  } catch (e) {
    registrarLog('ERRO', 'Falha ao popular dados de teste: ' + e.message);
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Remove dados de teste via chamada da sidebar.
 * @returns {{sucesso: boolean, mensagem: string}}
 */
function limparDadosTesteHTML() {
  try {
    const resultado = limparDadosTeste();
    return {
      sucesso:  true,
      mensagem: `Removidos: ${resultado.turmasRemovidas} turma(s) e ${resultado.alunosRemovidos} aluno(s) de teste.`
    };
  } catch (e) {
    registrarLog('ERRO', 'Falha ao limpar dados de teste: ' + e.message);
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Retorna todas as habilidades BNCC ativas para autocomplete no cliente.
 * Chamada UMA vez por sessão — os dados são cacheados no client-side.
 * @returns {Array} Lista de {codigo, componente, anoSerie, descricao}
 */
function listarTodosBNCCAutocompleteHTML() {
  try {
    const cache = _obterCacheBNCC();
    return Object.values(cache).map(h => ({
      codigo:     h.codigo,
      componente: h.componente,
      anoSerie:   h.anoSerie,
      descricao:  h.descricao
    }));
  } catch (e) {
    registrarLog('ERRO', 'Autocomplete BNCC: ' + e.message);
    return [];
  }
}

// ── Menu triggers para seed ──
function popularBNCCViaMenu() {
  try {
    const resultado = popularBNCCInicial();
    const ui = _obterUI();
    if (ui) {
      ui.alert('✅ Catálogo BNCC Populado',
        `${resultado.inseridos} habilidade(s) inserida(s).\n${resultado.pulados} já existiam.\nTotal no catálogo: ${resultado.total}.`,
        ui.ButtonSet.OK);
    }
  } catch (e) { _mostrarErro('Erro ao popular BNCC: ' + e.message); }
}

function popularDadosTesteViaMenu() {
  try {
    const resultado = popularTurmasTeste();
    const ui = _obterUI();
    if (ui) {
      ui.alert('✅ Dados de Teste Inseridos',
        `${resultado.turmas} turma(s) e ${resultado.alunos} aluno(s) inseridos.\n\nUse "Limpar Dados de Teste" antes de usar em produção.`,
        ui.ButtonSet.OK);
    }
  } catch (e) { _mostrarErro('Erro ao popular dados de teste: ' + e.message); }
}

function limparDadosTesteViaMenu() {
  try {
    const ui = _obterUI();
    if (ui) {
      const resp = ui.alert('⚠️ Confirmar Limpeza',
        'Esta ação removerá TODAS as turmas e alunos de teste (prefixo TESTE_).\nContinuar?',
        ui.ButtonSet.YES_NO);
      if (resp !== ui.Button.YES) return;
    }
    const resultado = limparDadosTeste();
    if (ui) {
      ui.alert('✅ Dados de Teste Removidos',
        `${resultado.turmasRemovidas} turma(s) e ${resultado.alunosRemovidos} aluno(s) removidos.`,
        ui.ButtonSet.OK);
    }
  } catch (e) { _mostrarErro('Erro ao limpar dados de teste: ' + e.message); }
}

// _obterUI() definida uma única vez acima (~linha 605)

// ============================================================
// FREQUÊNCIA — WRAPPERS HTML
// ============================================================

/**
 * Lista alunos ativos de uma turma para o formulário de chamada.
 * @param {string} turma
 * @returns {{id:string, nome:string, turno:string, possuiNEE:boolean}[]}
 */
function listarAlunosTurmaHTML(turma) {
  try {
    const dados = lerTurmasAlunos(turma);
    return dados
      .filter(linha => String(linha[14] || '').trim() === 'Ativo')
      .map(linha => ({
        id:        String(linha[0] || '').trim(),
        nome:      String(linha[1] || '').trim(),
        turno:     String(linha[4] || '').trim(),
        possuiNEE: String(linha[9] || '').trim().toLowerCase() === 'sim'
      }))
      .filter(a => a.nome);
  } catch (e) {
    registrarLog('ERRO', 'listarAlunosTurmaHTML: ' + e.message);
    return [];
  }
}

/**
 * Lança chamada em lote para todos os alunos de uma turma.
 * @param {string} turma
 * @param {string} data       - dd/MM/yyyy
 * @param {string} componente - Componente curricular (vazio = geral)
 * @param {{nome:string, presenca:string}[]} registros
 * @returns {{sucesso:boolean, processados?:number, alertas?:number, mensagem?:string}}
 */
function lancarFrequenciaLoteHTML(turma, data, componente, registros) {
  try {
    verificarPermissao(PAPEIS.PROFESSOR);
    if (!turma || !data || !registros || registros.length === 0) {
      return { sucesso: false, mensagem: 'Dados incompletos para lançamento.' };
    }
    let processados = 0;
    registros.forEach(r => {
      if (r.nome && (r.presenca === 'P' || r.presenca === 'F')) {
        lancarFrequencia(turma, data, r.nome, r.presenca, componente || '');
        processados++;
      }
    });
    // Verificar limite de faltas após lançamento (LDBEN Art. 24)
    let alertas = 0;
    try {
      const config = getConfig();
      const frequencias = buscarFrequenciasTurma(turma);
      const limiteAlerta = config.PEDAGOGICO.PERCENTUAL_FALTA_ALERTA;
      alertas = frequencias.filter(a => a.percentualFalta >= limiteAlerta).length;
      if (alertas > 0) verificarLimiteFaltas(turma);
    } catch (e2) {
      registrarLog('ALERTA', 'Não foi possível verificar limite de faltas: ' + e2.message);
    }
    registrarLog('INFO', `Chamada lançada: ${turma} | ${data} | ${processados} aluno(s)`);
    return { sucesso: true, processados, alertas };
  } catch (e) {
    registrarLog('ERRO', 'lancarFrequenciaLoteHTML: ' + e.message);
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Gera formulário de chamada para a turma e retorna a URL pública.
 * @param {string} turma
 * @returns {{sucesso:boolean, url?:string, mensagem?:string}}
 */
function gerarChamadaFormHTML(turma) {
  try {
    const url = gerarChamadaForm(turma, dataHoje());
    return { sucesso: true, url };
  } catch (e) {
    registrarLog('ERRO', 'gerarChamadaFormHTML: ' + e.message);
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * Retorna resumo de frequências classificado por nível de alerta.
 * @param {string} turma
 * @returns {{alunos:Object[], limiteAlerta:number, limiteCritico:number}}
 */
function buscarFrequenciasResumoHTML(turma) {
  try {
    const config = getConfig();
    const alunos = buscarFrequenciasTurma(turma);
    const limiteAlerta  = config.PEDAGOGICO.PERCENTUAL_FALTA_ALERTA  || 0.20;
    const limiteCritico = config.PEDAGOGICO.PERCENTUAL_FALTA_CRITICO || 0.25;
    const classificados = alunos.map(a => ({
      ...a,
      nivel:        a.percentualFalta >= limiteCritico ? 'critico' :
                    a.percentualFalta >= limiteAlerta  ? 'atencao' : 'ok',
      pctFormatado: Math.round(a.percentualFalta * 100) + '%'
    }));
    classificados.sort((a, b) => {
      const ordem = { critico: 0, atencao: 1, ok: 2 };
      return ordem[a.nivel] - ordem[b.nivel];
    });
    return { alunos: classificados, limiteAlerta, limiteCritico };
  } catch (e) {
    registrarLog('ERRO', 'buscarFrequenciasResumoHTML: ' + e.message);
    return { alunos: [], limiteAlerta: 0.20, limiteCritico: 0.25 };
  }
}

// ============================================================
// MATRÍCULA — WRAPPERS HTML
// ============================================================

/**
 * Matricula um aluno a partir dos dados do formulário da sidebar.
 * @param {Object} dados - Campos do formulário de matrícula
 * @returns {{sucesso:boolean, id?:string, mensagem?:string}}
 */
function matricularAlunoHTML(dados) {
  try {
    verificarPermissao(PAPEIS.COORDENADOR);
    if (!dados || !dados.nomeCompleto || !dados.turma || !dados.segmento) {
      return { sucesso: false, mensagem: 'Campos obrigatórios não preenchidos: Nome, Turma e Segmento.' };
    }
    const id = matricularAluno(dados);
    return { sucesso: true, id };
  } catch (e) {
    registrarLog('ERRO', 'matricularAlunoHTML: ' + e.message);
    return { sucesso: false, mensagem: e.message };
  }
}
