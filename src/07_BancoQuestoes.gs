/**
 * PEDAGOGO.AI — Banco de Questões e Geração de Provas (Bloco 3)
 * Arquivo: 07_BancoQuestoes.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Geração e gerenciamento de questões objetivas e discursivas.
 * Montagem de provas com controle de dificuldade e habilidades BNCC.
 * Geração automática de gabarito e rubrica.
 *
 * Referência: Bloco 3.1, 3.2, 3.3 do prompt mestre
 */

// ============================================================
// TIPOS E NÍVEIS
// ============================================================

const TIPOS_QUESTAO = Object.freeze({
  OBJETIVA:   'OBJETIVA',
  DISCURSIVA: 'DISCURSIVA',
  MISTA:      'MISTA'
});

const DIFICULDADES = Object.freeze({
  FACIL:  'FACIL',
  MEDIO:  'MEDIO',
  DIFICIL:'DIFICIL'
});

// Distribuição padrão de dificuldade em provas (Bloco 3.2)
const DISTRIBUICAO_PADRAO = Object.freeze({
  FACIL:   0.30,  // 30% fácil
  MEDIO:   0.50,  // 50% médio
  DIFICIL: 0.20   // 20% difícil
});

// ============================================================
// GERAÇÃO DE QUESTÕES
// ============================================================

/**
 * Gera uma questão objetiva (múltipla escolha) via Gemini.
 * Valida código BNCC ANTES de qualquer chamada ao modelo.
 *
 * @param {Object} params
 * @param {string} params.componente     - Ex: 'Língua Portuguesa'
 * @param {string} params.ano            - Ex: '6º Ano'
 * @param {string} params.codigoHabilidade - Código BNCC validado
 * @param {string} params.dificuldade    - 'FACIL' | 'MEDIO' | 'DIFICIL'
 * @param {string} params.nivelBloom     - Nível da Taxonomia de Bloom
 * @param {string} [params.contexto]     - Tema/contexto adicional
 * @returns {Object} Questão estruturada salva no banco
 */
function gerarQuestaoObjetiva(params) {
  // Validação BNCC obrigatória
  const habilidade = buscarHabilidadeBNCC(params.codigoHabilidade);

  const prompt = `Gere UMA questão objetiva (múltipla escolha com 4 alternativas) com as seguintes especificações:

COMPONENTE: ${params.componente}
ANO/SÉRIE: ${params.ano}
HABILIDADE BNCC: ${habilidade.codigo} — ${habilidade.descricao}
NÍVEL DE DIFICULDADE: ${params.dificuldade}
NÍVEL BLOOM: ${params.nivelBloom || habilidade.nivelBloom}
${params.contexto ? 'CONTEXTO/TEMA: ' + params.contexto : ''}

REQUISITOS DA QUESTÃO:
• Enunciado claro, objetivo e adequado ao nível de escolaridade
• 4 alternativas (A, B, C, D) — apenas UMA correta
• Distratores plausíveis que revelem erros conceituais comuns
• Se necessário usar imagem, indique: [REQUER_IMAGEM: descrição breve]
• Gabarito com justificativa pedagógica (2-3 linhas)

RETORNE EM FORMATO JSON:
{
  "enunciado": "texto completo da questão",
  "alternativas": {
    "A": "texto da alternativa A",
    "B": "texto da alternativa B",
    "C": "texto da alternativa C",
    "D": "texto da alternativa D"
  },
  "gabarito": "A|B|C|D",
  "justificativa": "explicação pedagógica da resposta correta",
  "requer_imagem": false,
  "descricao_imagem": ""
}`;

  const resultado = chamarGeminiJSON(prompt);

  // Salvar no banco de questões
  return salvarQuestaoNoBanco({
    tipo:            TIPOS_QUESTAO.OBJETIVA,
    componente:      params.componente,
    ano:             params.ano,
    habilidade:      habilidade.codigo,
    nivelBloom:      params.nivelBloom || habilidade.nivelBloom,
    dificuldade:     params.dificuldade,
    enunciado:       resultado.enunciado,
    alternativas:    resultado.alternativas,
    gabarito:        resultado.gabarito,
    justificativa:   resultado.justificativa,
    requerImagem:    resultado.requer_imagem,
    descImagem:      resultado.descricao_imagem
  });
}

/**
 * Gera uma questão discursiva com rubrica de correção via Gemini.
 *
 * @param {Object} params - Mesmos parâmetros de gerarQuestaoObjetiva
 * @param {number} [params.pontuacaoMax=10] - Pontuação máxima
 * @param {number} [params.numCriterios=4] - Número de critérios na rubrica
 * @returns {Object} Questão discursiva salva no banco
 */
function gerarQuestaoDiscursiva(params) {
  const habilidade = buscarHabilidadeBNCC(params.codigoHabilidade);
  const pontuacaoMax = params.pontuacaoMax || 10;
  const numCriterios = params.numCriterios || 4;

  const prompt = `Gere UMA questão discursiva com rubrica detalhada:

COMPONENTE: ${params.componente}
ANO/SÉRIE: ${params.ano}
HABILIDADE BNCC: ${habilidade.codigo} — ${habilidade.descricao}
NÍVEL DE DIFICULDADE: ${params.dificuldade}
PONTUAÇÃO MÁXIMA: ${pontuacaoMax} pontos
NÚMERO DE CRITÉRIOS NA RUBRICA: ${numCriterios}
${params.contexto ? 'CONTEXTO/TEMA: ' + params.contexto : ''}

REQUISITOS:
• Enunciado que exija produção textual ou resolução argumentada
• Rubrica com ${numCriterios} critérios de avaliação
• Cada critério com 3 níveis: Não Demonstrado (0), Em Desenvolvimento (parcial), Consolidado (total)
• Pontuação distribuída entre os critérios totalizando ${pontuacaoMax} pontos
• Gabarito referência com resposta esperada (2-4 parágrafos)

RETORNE EM FORMATO JSON:
{
  "enunciado": "texto completo da questão",
  "gabarito_referencia": "resposta esperada",
  "rubrica": [
    {
      "criterio": "nome do critério",
      "descricao": "o que é avaliado",
      "pontuacao_maxima": X,
      "niveis": {
        "nao_demonstrado": {"descricao": "...", "pontos": 0},
        "em_desenvolvimento": {"descricao": "...", "pontos": X/2},
        "consolidado": {"descricao": "...", "pontos": X}
      }
    }
  ],
  "pontuacao_total": ${pontuacaoMax}
}`;

  const resultado = chamarGeminiJSON(prompt);

  return salvarQuestaoNoBanco({
    tipo:         TIPOS_QUESTAO.DISCURSIVA,
    componente:   params.componente,
    ano:          params.ano,
    habilidade:   habilidade.codigo,
    nivelBloom:   params.nivelBloom || habilidade.nivelBloom,
    dificuldade:  params.dificuldade,
    enunciado:    resultado.enunciado,
    gabarito:     resultado.gabarito_referencia,
    rubrica:      JSON.stringify(resultado.rubrica),
    pontuacaoMax: pontuacaoMax
  });
}

/**
 * Salva uma questão gerada no BANCO_QUESTOES.
 *
 * @param {Object} questao - Dados da questão
 * @returns {Object} Questão com ID gerado
 */
function salvarQuestaoNoBanco(questao) {
  const config = getConfig();

  // Gerar ID único
  const sequencia = _obterProximoSequencial();
  const id = gerarIDQuestao(
    questao.componente.substring(0, 2).toUpperCase(),
    questao.habilidade,
    questao.tipo === TIPOS_QUESTAO.OBJETIVA ? 'OBJ' : 'DIS',
    sequencia
  );

  const linha = [
    id,
    questao.tipo,
    questao.componente,
    questao.ano,
    questao.habilidade,
    questao.nivelBloom || '',
    questao.dificuldade,
    questao.enunciado,
    questao.alternativas ? JSON.stringify(questao.alternativas) : '',
    questao.gabarito || '',
    questao.rubrica || '',
    getUsuarioAtivo(),
    formatarData(new Date(), 'dd/MM/yyyy'),
    'TRUE',
    questao.requerImagem ? 'TRUE' : 'FALSE',
    questao.descImagem || ''
  ];

  escreverLinha(config.SHEETS.BANCO_QUESTOES, 'Questões', linha);
  questao.id = id;

  registrarLog('INFO', `Questão salva no banco: ${id}`, `Habilidade: ${questao.habilidade}`);
  return questao;
}

// ============================================================
// MONTAGEM DE PROVAS (Bloco 3.2)
// ============================================================

/**
 * Monta uma prova completa a partir do banco de questões.
 * Cria Google Doc da prova + Google Doc do gabarito separado.
 *
 * @param {Object} params
 * @param {string} params.titulo         - Título da prova
 * @param {string} params.turma          - Turma destino
 * @param {string} params.componente     - Componente curricular
 * @param {string} params.bimestre       - Ex: '1B_2026'
 * @param {string[]} params.habilidades  - Códigos BNCC a cobrir
 * @param {number} params.totalObjetivas - Nº de questões objetivas
 * @param {number} params.totalDiscursivas- Nº de questões discursivas
 * @param {boolean} [params.versaoB]     - Se true, gera versão B embaralhada
 * @returns {Object} { urlProvaA, urlProvaB, urlGabarito, idGabarito }
 */
function montarProva(params) {
  // Validar todos os códigos BNCC
  const validacao = validarArrayCodigos(params.habilidades || []);
  if (validacao.invalidos.length > 0) {
    throw new Error(
      `Habilidades BNCC inválidas: ${validacao.invalidos.join(', ')}. ` +
      `Verifique o catálogo MASTER_BNCC.`
    );
  }

  registrarLog('INFO', `Montando prova: ${params.titulo}`, `Turma: ${params.turma}`);

  // Buscar questões do banco
  const questoesObj = _selecionarQuestoes(
    params.componente,
    params.habilidades,
    params.totalObjetivas || 10,
    TIPOS_QUESTAO.OBJETIVA
  );
  const questoesDis = _selecionarQuestoes(
    params.componente,
    params.habilidades,
    params.totalDiscursivas || 2,
    TIPOS_QUESTAO.DISCURSIVA
  );

  const questoesProva = [...questoesObj, ...questoesDis];

  // Criar documento da prova Versão A
  const urlProvaA = _gerarDocumentoProva(questoesProva, params, 'A');

  // Criar gabarito (documento separado, protegido)
  const { urlGabarito, idGabarito } = _gerarGabarito(questoesProva, params);

  // Salvar registro na planilha BANCO_QUESTOES aba Gabaritos
  _registrarProva(params, questoesProva, idGabarito);

  const resultado = { urlProvaA, urlGabarito, idGabarito };

  // Gerar versão B embaralhada (opcional)
  if (params.versaoB) {
    const questoesEmbaralhadas = _embaralharQuestoes([...questoesObj], questoesDis);
    resultado.urlProvaB = _gerarDocumentoProva(questoesEmbaralhadas, params, 'B');
  }

  registrarLog('INFO', `Prova montada: ${params.titulo}`, `Gabarito ID: ${idGabarito}`);
  return resultado;
}

/**
 * Seleciona questões do banco respeitando a distribuição de dificuldade.
 * @private
 */
function _selecionarQuestoes(componente, habilidades, total, tipo) {
  const todasQuestoes = lerBancoQuestoes({ componente, tipo });
  const questoesFiltradas = todasQuestoes.filter(q => {
    const habQ = String(q[4] || '').toUpperCase();
    return habilidades.some(h => h.toUpperCase() === habQ);
  });

  // Distribuição por dificuldade
  const qtdFacil   = Math.round(total * DISTRIBUICAO_PADRAO.FACIL);
  const qtdMedio   = Math.round(total * DISTRIBUICAO_PADRAO.MEDIO);
  const qtdDificil = total - qtdFacil - qtdMedio;

  const selecionadas = [
    ..._filtrarPorDificuldade(questoesFiltradas, 'FACIL').slice(0, qtdFacil),
    ..._filtrarPorDificuldade(questoesFiltradas, 'MEDIO').slice(0, qtdMedio),
    ..._filtrarPorDificuldade(questoesFiltradas, 'DIFICIL').slice(0, qtdDificil)
  ];

  if (selecionadas.length < total) {
    registrarLog('ALERTA',
      `Banco insuficiente: solicitadas ${total} questões, encontradas ${selecionadas.length}`,
      `Componente: ${componente} | Tipo: ${tipo}`
    );
  }

  return selecionadas;
}

function _filtrarPorDificuldade(questoes, dificuldade) {
  return questoes.filter(q => String(q[6] || '').toUpperCase() === dificuldade);
}

/**
 * Gera o Google Doc da prova (versão A ou B).
 * @private
 */
function _gerarDocumentoProva(questoes, params, versao) {
  const titulo = `${params.titulo}_Versao${versao}_${params.turma}`;
  const doc = DocumentApp.create(titulo);
  const body = doc.getBody();

  // Cabeçalho
  body.appendParagraph(`${getConfig().ESCOLA}`).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(`${params.turma} | ${params.componente} | ${params.bimestre}`).setItalic(true);
  body.appendParagraph(`ALUNO(A): ______________________________ DATA: __________`);
  body.appendHorizontalRule();
  body.appendParagraph(`${params.titulo} — VERSÃO ${versao}`).setHeading(DocumentApp.ParagraphHeading.HEADING1);

  // Questões objetivas
  const objetivas = questoes.filter(q => String(q[1]) === TIPOS_QUESTAO.OBJETIVA);
  if (objetivas.length > 0) {
    body.appendParagraph('PARTE I — QUESTÕES OBJETIVAS').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    objetivas.forEach((q, i) => {
      body.appendParagraph(`${i + 1}. ${q[7]}`);  // Enunciado
      const alts = JSON.parse(q[8] || '{}');
      ['A', 'B', 'C', 'D'].forEach(letra => {
        if (alts[letra]) body.appendParagraph(`   (${letra}) ${alts[letra]}`);
      });
    });
  }

  // Questões discursivas
  const discursivas = questoes.filter(q => String(q[1]) === TIPOS_QUESTAO.DISCURSIVA);
  if (discursivas.length > 0) {
    body.appendParagraph('PARTE II — QUESTÕES DISCURSIVAS').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    discursivas.forEach((q, i) => {
      body.appendParagraph(`${objetivas.length + i + 1}. ${q[7]}`);
      body.appendParagraph('Resposta: _________________________________________________');
      body.appendParagraph('');
      body.appendParagraph('');
    });
  }

  doc.saveAndClose();
  return salvarProva(doc.getId(), params.turma, params.bimestre);
}

/**
 * Gera o Google Doc do gabarito (protegido até após a prova).
 * @private
 */
function _gerarGabarito(questoes, params) {
  const titulo = `GABARITO_${params.titulo}_${params.turma}`;
  const doc = DocumentApp.create(titulo);
  const body = doc.getBody();

  body.appendParagraph(`GABARITO — USO EXCLUSIVO DO PROFESSOR`).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(`${params.titulo} | ${params.turma} | ${params.bimestre}`).setItalic(true);
  body.appendHorizontalRule();

  questoes.forEach((q, i) => {
    const ehObj = String(q[1]) === TIPOS_QUESTAO.OBJETIVA;
    body.appendParagraph(`${i + 1}. Gabarito: ${q[9]}`);  // Gabarito
    if (ehObj && q[9]) {
      body.appendParagraph(`   Habilidade BNCC: ${q[4]}`);
      body.appendParagraph(`   Dificuldade: ${q[6]}`);
    }
    if (!ehObj && q[10]) {
      const rubrica = JSON.parse(q[10] || '[]');
      body.appendParagraph('   Rubrica:');
      if (Array.isArray(rubrica)) {
        rubrica.forEach(criterio => {
          body.appendParagraph(`   • ${criterio.criterio}: ${criterio.pontuacao_maxima} pts`);
        });
      }
    }
  });

  doc.saveAndClose();
  const urlGabarito = salvarGabarito(doc.getId());
  return { urlGabarito, idGabarito: doc.getId() };
}

/**
 * Registra a prova na aba Gabaritos do BANCO_QUESTOES.
 * @private
 */
function _registrarProva(params, questoes, idGabarito) {
  const config = getConfig();
  const ids = questoes.map(q => q[0]).join(';');  // IDs das questões
  const objetivas = questoes.filter(q => String(q[1]) === TIPOS_QUESTAO.OBJETIVA).length;
  const discursivas = questoes.length - objetivas;

  escreverLinha(config.SHEETS.BANCO_QUESTOES, 'Gabaritos', [
    idGabarito, params.titulo, params.turma, params.componente,
    params.bimestre, formatarData(new Date(), 'dd/MM/yyyy'),
    ids, objetivas, discursivas, 0.7, 0.3, 10
  ]);
}

function _embaralharQuestoes(objetivas, discursivas) {
  // Fisher-Yates shuffle nas objetivas
  for (let i = objetivas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [objetivas[i], objetivas[j]] = [objetivas[j], objetivas[i]];
  }
  return [...objetivas, ...discursivas];
}

function _obterProximoSequencial() {
  const config = getConfig();
  const dados = lerAba(config.SHEETS.BANCO_QUESTOES, 'Questões');
  return Math.max(1, dados.length);
}
