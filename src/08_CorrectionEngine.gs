/**
 * PEDAGOGO.AI — Motor de Correção Automática (Bloco 4)
 * Arquivo: 08_CorrectionEngine.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Correção automática de questões objetivas via Google Forms.
 * Avaliação semi-automática de questões discursivas via Gemini.
 * Análise de desempenho por habilidade BNCC com identificação de gargalos.
 *
 * REGRA CRÍTICA: Toda nota discursiva requer validação humana antes de ser lançada.
 *
 * Referência: Bloco 4.1, 4.2, 4.3 do prompt mestre
 */

// ============================================================
// PROCESSAMENTO DO FORMULÁRIO DE PROVA (Bloco 4.2)
// ============================================================

/**
 * Processa todas as respostas de uma prova submetidas via Google Form.
 * Corrige objetivas automaticamente e encaminha discursivas para avaliação Gemini.
 *
 * @param {string} idFormulario - ID da planilha de respostas do Forms
 * @param {string} idGabarito   - ID do Google Doc do gabarito
 */
function processarRespostasProva(idFormulario, idGabarito) {
  const respostas = SpreadsheetApp.openById(idFormulario).getActiveSheet();
  const gabarito = buscarGabarito(idGabarito);
  const config = getConfig();
  const resultados = SpreadsheetApp.openById(config.SHEETS.RESULTADOS);

  let processados = 0;
  let erros = 0;

  respostas.getDataRange().getValues().slice(1).forEach((linha, i) => {
    try {
      const aluno = {
        nome:      String(linha[1] || '').trim(),
        turma:     String(linha[2] || '').trim(),
        respostas: linha.slice(3)
      };

      if (!aluno.nome) return;

      // Calcular desempenho nas objetivas
      const analise = calcularDesempenho(aluno.respostas, gabarito);
      const notaObjetiva = gabarito.totalObjetivas > 0
        ? (analise.acertos / gabarito.totalObjetivas) * gabarito.pesoObjetivo
        : 0;

      // Classificar erros por habilidade BNCC
      const porHabilidade = agruparPorHabilidade(analise.erros, gabarito.habilidades);

      // Registrar resultado preliminar (sem discursivas ainda)
      escreverResultado({
        data:              new Date(),
        aluno:             aluno.nome,
        turma:             aluno.turma,
        componente:        gabarito.componente,
        prova:             gabarito.titulo,
        nota:              notaObjetiva,
        acertos:           analise.acertos,
        totalQuestoes:     gabarito.totalObjetivas,
        habilidadesCriticas: porHabilidade.criticas.map(h => h.codigo),
        bimestre:          gabarito.bimestre,
        status:            gabarito.totalDiscursivas > 0 ? 'PARCIAL' : 'FINALIZADO'
      });

      processados++;
    } catch (e) {
      erros++;
      registrarLog('ERRO', `Erro ao processar resposta da linha ${i + 2}: ${e.message}`);
    }
  });

  // Gerar relatório automático da turma
  if (processados > 0) {
    gerarRelatorioTurma(gabarito.turma, gabarito.componente, gabarito.bimestre);
  }

  registrarLog('INFO',
    `Prova processada: ${processados} alunos`,
    `Erros: ${erros} | Gabarito: ${idGabarito}`
  );
}

/**
 * Calcula o desempenho de um aluno comparando respostas ao gabarito.
 *
 * @param {Array} respostasAluno - Respostas do aluno na ordem das questões
 * @param {Object} gabarito - Gabarito com respostas corretas
 * @returns {{ acertos: number, erros: Array, percentualAcerto: number }}
 */
function calcularDesempenho(respostasAluno, gabarito) {
  let acertos = 0;
  const erros = [];

  gabarito.questoesObjetivas.forEach((questao, i) => {
    const resposta = String(respostasAluno[i] || '').trim().toUpperCase();
    const correta  = String(questao.gabarito || '').trim().toUpperCase();

    if (resposta === correta) {
      acertos++;
    } else {
      erros.push({
        numeroQuestao: i + 1,
        respostaAluno: resposta,
        respostaCorreta: correta,
        habilidade: questao.habilidade,
        dificuldade: questao.dificuldade
      });
    }
  });

  return {
    acertos,
    erros,
    percentualAcerto: gabarito.totalObjetivas > 0 ? acertos / gabarito.totalObjetivas : 0
  };
}

/**
 * Agrupa os erros por habilidade BNCC e classifica como críticas (>50% de erros).
 *
 * @param {Array} erros - Lista de erros do aluno
 * @param {Array} habilidades - Mapa questão → habilidade do gabarito
 * @returns {{ criticas: Array, emDesenvolvimento: Array }}
 */
function agruparPorHabilidade(erros, habilidades) {
  const contagem = {};

  habilidades.forEach(h => {
    contagem[h.codigo] = contagem[h.codigo] || { codigo: h.codigo, total: 0, erros: 0 };
    contagem[h.codigo].total++;
  });

  erros.forEach(erro => {
    if (erro.habilidade && contagem[erro.habilidade]) {
      contagem[erro.habilidade].erros++;
    }
  });

  const resultado = { criticas: [], emDesenvolvimento: [] };

  Object.values(contagem).forEach(h => {
    if (h.total === 0) return;
    const percErro = h.erros / h.total;
    h.percentualErro = percErro;
    if (percErro >= 0.50) {
      resultado.criticas.push(h);
    } else if (percErro >= 0.30) {
      resultado.emDesenvolvimento.push(h);
    }
  });

  return resultado;
}

/**
 * Identifica habilidades com menos de 50% de acertos em uma turma.
 * Usado pelo módulo de Relatórios para gargalos pedagógicos.
 *
 * @param {string} turma      - Identificador da turma
 * @param {string} componente - Componente curricular
 * @returns {Array} Habilidades críticas com percentual de acerto
 */
function identificarGargalos(turma, componente) {
  const dados = buscarResultadosTurma(turma, componente);
  return dados.filter(h => h.percentualAcerto < 0.50);
}

/**
 * Busca e agrega resultados de uma turma por habilidade.
 * @private
 */
function buscarResultadosTurma(turma, componente) {
  const resultados = lerResultados(turma, componente);
  const porHabilidade = {};

  resultados.forEach(linha => {
    const habilidades = String(linha[8] || '').split(';').map(h => h.trim()).filter(h => h);
    habilidades.forEach(hab => {
      porHabilidade[hab] = porHabilidade[hab] || { codigo: hab, totalAlunos: 0, totalErros: 0 };
      porHabilidade[hab].totalAlunos++;
      porHabilidade[hab].totalErros++;  // Está na lista de críticas = teve erro
    });
  });

  return Object.values(porHabilidade).map(h => ({
    ...h,
    percentualAcerto: h.totalAlunos > 0 ? 1 - (h.totalErros / h.totalAlunos) : 1
  }));
}

// ============================================================
// AVALIAÇÃO DE QUESTÕES DISCURSIVAS (Bloco 4.3)
// ============================================================

/**
 * Avalia uma resposta discursiva usando Gemini como corretor pedagógico.
 * REGRA CRÍTICA: requer_revisao_humana é SEMPRE true — nunca lançar automaticamente.
 *
 * @param {string} respostaAluno   - Texto da resposta do aluno
 * @param {string} enunciado       - Enunciado da questão
 * @param {string} codigoHabilidade - Código BNCC da questão
 * @param {string|Object} rubrica  - Rubrica de correção (JSON ou string)
 * @param {boolean} [isEJA=false]  - Se aluno é da EJA (adapta tom do feedback)
 * @returns {Object} Resultado da avaliação (sempre com requer_revisao_humana: true)
 */
function avaliarDiscursiva(respostaAluno, enunciado, codigoHabilidade, rubrica, isEJA) {
  // Buscar habilidade BNCC real
  const habilidade = buscarHabilidadeBNCC(codigoHabilidade);

  const rubricaTexto = typeof rubrica === 'string' ? rubrica : JSON.stringify(rubrica, null, 2);

  const prompt = `VOCÊ É UM CORRETOR PEDAGÓGICO ESPECIALIZADO. Analise a resposta discursiva abaixo.

QUESTÃO: ${enunciado}

HABILIDADE BNCC: ${habilidade.codigo} — ${habilidade.descricao}

RESPOSTA DO ALUNO:
"${respostaAluno}"

RUBRICA DE CORREÇÃO:
${rubricaTexto}

INSTRUÇÕES DE AVALIAÇÃO:
1. Leia a resposta com atenção pedagógica e julgamento cuidadoso
2. Para cada critério da rubrica, atribua o nível de desempenho
3. Some os pontos e calcule a nota sugerida
4. Escreva um FEEDBACK construtivo de 3-5 linhas, em linguagem acolhedora, explicando:
   a) O que o aluno demonstrou dominar
   b) O que precisa ser desenvolvido
   c) Uma sugestão específica de estudo ou prática
5. NÃO use linguagem punitiva ou desmotivadora
${isEJA ? '6. Para turmas EJA: valorize a experiência de vida do aluno no feedback' : ''}

RETORNE EM FORMATO JSON (apenas JSON, sem texto adicional):
{
  "nota_sugerida": 0.0,
  "pontuacao_por_criterio": [
    {"criterio": "...", "nivel": "nao_demonstrado|em_desenvolvimento|consolidado", "pontos": 0}
  ],
  "feedback_aluno": "...",
  "observacao_professor": "...",
  "requer_revisao_humana": true
}`;

  const resultado = chamarGeminiJSON(prompt, { temperature: 0.3 });

  // GARANTIA: requer_revisao_humana é SEMPRE true (regra inviolável do sistema)
  resultado.requer_revisao_humana = true;
  resultado.status = 'AGUARDANDO_REVISAO';

  registrarLog('INFO',
    `Discursiva avaliada pelo Gemini — aguardando revisão humana`,
    `Habilidade: ${codigoHabilidade}`
  );

  return resultado;
}

// ============================================================
// CRIAÇÃO DE PROVA DIGITAL VIA GOOGLE FORMS (Bloco 4.1)
// ============================================================

/**
 * Converte uma prova gerada em Google Form para aplicação digital.
 * Configura coleta de e-mail, limite de 1 resposta e vinculação ao gabarito.
 *
 * @param {string} idGabarito - ID do gabarito da prova (aba Gabaritos de BANCO_QUESTOES)
 * @param {Object} [opcoes]   - { prazo: 'dd/MM/yyyy', vincularClassroom: false }
 * @returns {{ urlForm: string, idForm: string, idRespostas: string }}
 */
function criarProvaDigital(idGabarito, opcoes) {
  const gabarito = buscarGabarito(idGabarito);
  const config = getConfig();
  opcoes = opcoes || {};

  const form = FormApp.create(`${gabarito.titulo} — ${gabarito.turma}`);
  form.setDescription(
    `${config.ESCOLA}\n` +
    `Turma: ${gabarito.turma} | ${gabarito.componente} | ${gabarito.bimestre}\n` +
    `Valor: ${gabarito.notaMaxima} pontos\n\n` +
    `INSTRUÇÕES:\n` +
    `• Leia cada questão com atenção antes de responder.\n` +
    `• Nas questões objetivas, marque apenas UMA alternativa.\n` +
    `• Nas questões discursivas, escreva sua resposta completa.\n` +
    `• Após finalizar, clique em ENVIAR. Você terá apenas 1 tentativa.`
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
  form.setConfirmationMessage('Prova enviada com sucesso! Aguarde a correção pelo professor.');

  // Não liberar notas automaticamente (Bloco 4.1: liberar manualmente após revisão)
  form.setIsQuiz(true);

  // Campo: Nome do aluno
  const campoNome = form.addTextItem();
  campoNome.setTitle('Nome completo do aluno');
  campoNome.setRequired(true);

  // Campo: Turma (pré-preenchido)
  const campoTurma = form.addListItem();
  campoTurma.setTitle('Turma');
  campoTurma.setChoiceValues([gabarito.turma]);
  campoTurma.setRequired(true);

  // Seção de Questões Objetivas
  if (gabarito.questoesObjetivas.length > 0) {
    form.addSectionHeaderItem()
      .setTitle('PARTE I — QUESTÕES OBJETIVAS')
      .setHelpText(`${gabarito.questoesObjetivas.length} questão(ões) — Marque apenas UMA alternativa`);

    gabarito.questoesObjetivas.forEach((questao, i) => {
      // Buscar dados completos do banco
      const dadosBanco = lerBancoQuestoes({});
      const questaoCompleta = dadosBanco.find(q => String(q[0]) === questao.id);

      if (questaoCompleta) {
        const item = form.addMultipleChoiceItem();
        item.setTitle(`Questão ${i + 1}: ${questaoCompleta[7]}`);  // Enunciado

        const alternativas = JSON.parse(questaoCompleta[8] || '{}');
        const choices = [];
        ['A', 'B', 'C', 'D'].forEach(letra => {
          if (alternativas[letra]) {
            choices.push(item.createChoice(
              `(${letra}) ${alternativas[letra]}`,
              letra === questao.gabarito  // Marca a correta para o quiz
            ));
          }
        });

        if (choices.length > 0) {
          item.setChoices(choices);
          item.setRequired(true);
          item.setPoints(Math.round(gabarito.notaMaxima * gabarito.pesoObjetivo / gabarito.totalObjetivas * 10) / 10);
        }
      }
    });
  }

  // Seção de Questões Discursivas
  if (gabarito.questoesDiscursivas.length > 0) {
    form.addSectionHeaderItem()
      .setTitle('PARTE II — QUESTÕES DISCURSIVAS')
      .setHelpText(`${gabarito.questoesDiscursivas.length} questão(ões) — Escreva sua resposta completa`);

    gabarito.questoesDiscursivas.forEach((questao, i) => {
      const dadosBanco = lerBancoQuestoes({});
      const questaoCompleta = dadosBanco.find(q => String(q[0]) === questao.id);

      if (questaoCompleta) {
        const item = form.addParagraphTextItem();
        item.setTitle(`Questão ${gabarito.totalObjetivas + i + 1}: ${questaoCompleta[7]}`);
        item.setRequired(true);
      }
    });
  }

  // Configurar prazo de encerramento (se fornecido)
  if (opcoes.prazo) {
    salvarPropriedade(`PRAZO_FORM_${form.getId()}`, opcoes.prazo);
  }

  // Obter ID da planilha de respostas vinculada
  let idRespostas = '';
  try {
    if (form.getDestinationType() === FormApp.DestinationType.SPREADSHEET) {
      idRespostas = form.getDestinationId();
    }
  } catch (e) {
    // Form sem destino externo — respostas armazenadas internamente
  }

  registrarLog('INFO',
    `Prova digital criada: ${gabarito.titulo}`,
    `Form: ${form.getId()} | Gabarito: ${idGabarito}`
  );

  return {
    urlForm:     form.getPublishedUrl(),
    idForm:      form.getId(),
    idRespostas: idRespostas,
    urlEditar:   form.getEditUrl()
  };
}

/**
 * Processa respostas de prova digital (trigger onFormSubmit do Form de prova).
 * Corrige objetivas automaticamente e encaminha discursivas para Gemini.
 *
 * @param {Object} e - Evento onFormSubmit
 */
function processarRespostaProvaDigital(e) {
  try {
    const formId = e.source.getId();

    // Buscar o gabarito vinculado a este form
    const propsChave = `GABARITO_FORM_${formId}`;
    const idGabarito = PropertiesService.getScriptProperties().getProperty(propsChave);
    if (!idGabarito) {
      registrarLog('ALERTA', `Gabarito não vinculado ao Form ${formId}`);
      return;
    }

    const gabarito = buscarGabarito(idGabarito);
    const resposta = e.response;
    const itens = resposta.getItemResponses();
    const emailAluno = resposta.getRespondentEmail();

    // Extrair nome e turma (campos 0 e 1)
    const nomeAluno = itens[0].getResponse();
    const turmaAluno = itens[1].getResponse();

    // Corrigir objetivas
    let acertos = 0;
    const respostasObj = itens.slice(2, 2 + gabarito.totalObjetivas);
    const errosPorHab = {};

    respostasObj.forEach((item, i) => {
      const respostaTexto = String(item.getResponse() || '');
      const letraResposta = respostaTexto.match(/\(([A-D])\)/);
      const resp = letraResposta ? letraResposta[1] : '';
      const correta = gabarito.questoesObjetivas[i] ? gabarito.questoesObjetivas[i].gabarito : '';

      if (resp.toUpperCase() === correta.toUpperCase()) {
        acertos++;
      } else {
        const hab = gabarito.questoesObjetivas[i] ? gabarito.questoesObjetivas[i].habilidade : '';
        if (hab) errosPorHab[hab] = (errosPorHab[hab] || 0) + 1;
      }
    });

    const notaObjetiva = gabarito.totalObjetivas > 0
      ? (acertos / gabarito.totalObjetivas) * gabarito.pesoObjetivo * gabarito.notaMaxima
      : 0;

    // Registrar resultado
    escreverResultado({
      data:              new Date(),
      aluno:             nomeAluno,
      turma:             turmaAluno,
      componente:        gabarito.componente,
      prova:             gabarito.titulo,
      nota:              parseFloat(notaObjetiva.toFixed(2)),
      acertos:           acertos,
      totalQuestoes:     gabarito.totalObjetivas,
      habilidadesCriticas: Object.keys(errosPorHab),
      bimestre:          gabarito.bimestre,
      status:            gabarito.totalDiscursivas > 0 ? 'PARCIAL' : 'FINALIZADO'
    });

    registrarLog('INFO',
      `Prova digital processada: ${nomeAluno}`,
      `Acertos: ${acertos}/${gabarito.totalObjetivas}`
    );

  } catch (e) {
    registrarLog('ERRO', `Erro ao processar prova digital: ${e.message}`, e.stack);
  }
}

// ============================================================
// CORREÇÃO EM LOTE DE REDAÇÕES (ref. Brisk Teaching — Bloco 1.2)
// ============================================================

/**
 * Corrige em lote todas as redações/respostas discursivas contidas em documentos
 * de uma pasta do Google Drive. Gera relatório consolidado.
 *
 * @param {string} pastaId         - ID da pasta no Drive com os Docs dos alunos
 * @param {string} enunciado       - Enunciado da questão/atividade
 * @param {string} codigoHabilidade - Código BNCC
 * @param {string|Object} rubrica  - Rubrica de correção
 * @param {boolean} [isEJA=false]  - Se turma EJA
 * @returns {{ totalCorrigidos: number, urlRelatorio: string }}
 */
function corrigirLoteRedacoes(pastaId, enunciado, codigoHabilidade, rubrica, isEJA) {
  const pasta = DriveApp.getFolderById(pastaId);
  const arquivos = pasta.getFilesByType(MimeType.GOOGLE_DOCS);
  const resultados = [];
  let processados = 0;
  let erros = 0;

  while (arquivos.hasNext()) {
    const arquivo = arquivos.next();
    try {
      const doc = DocumentApp.openById(arquivo.getId());
      const textoAluno = doc.getBody().getText().trim();

      if (textoAluno.length < 10) continue;  // Ignorar docs vazios ou quase vazios

      // Extrair nome do aluno do título do documento (convenção: "Redação — Nome do Aluno")
      const tituloDoc = arquivo.getName();
      const nomeAluno = tituloDoc.replace(/^(Reda[çc][ãa]o|Resposta|Atividade)\s*[-—:]\s*/i, '').trim() || tituloDoc;

      // Avaliar via Gemini
      const avaliacao = avaliarDiscursiva(textoAluno, enunciado, codigoHabilidade, rubrica, isEJA);

      // Adicionar feedback ao documento
      const body = doc.getBody();
      body.appendHorizontalRule();
      body.appendParagraph('AVALIAÇÃO PEDAGOGO.AI (Revisão Humana Necessária)')
        .setHeading(DocumentApp.ParagraphHeading.HEADING3);
      body.appendParagraph(`⚠️ Nota sugerida: ${avaliacao.nota_sugerida} — AGUARDANDO CONFIRMAÇÃO DO PROFESSOR`).setBold(true);
      body.appendParagraph(`\nFeedback para o aluno:\n${avaliacao.feedback_aluno}`);
      body.appendParagraph(`\nObservação para o professor:\n${avaliacao.observacao_professor}`).setItalic(true);

      if (avaliacao.pontuacao_por_criterio) {
        body.appendParagraph('\nDetalhamento por critério:');
        avaliacao.pontuacao_por_criterio.forEach(c => {
          body.appendParagraph(`  • ${c.criterio}: ${c.pontos} pts (${c.nivel})`);
        });
      }

      doc.saveAndClose();

      resultados.push({
        nome:  nomeAluno,
        nota:  avaliacao.nota_sugerida,
        feedback: avaliacao.feedback_aluno
      });

      processados++;
    } catch (e) {
      erros++;
      registrarLog('ALERTA', `Erro ao corrigir ${arquivo.getName()}: ${e.message}`);
    }
  }

  // Gerar relatório consolidado
  const urlRelatorio = _gerarRelatorioLote(resultados, enunciado, codigoHabilidade);

  registrarLog('INFO',
    `Correção em lote concluída: ${processados} documentos`,
    `Erros: ${erros} | Pasta: ${pastaId}`
  );

  return { totalCorrigidos: processados, totalErros: erros, urlRelatorio };
}

/**
 * Gera relatório consolidado da correção em lote.
 * @private
 */
function _gerarRelatorioLote(resultados, enunciado, codigoHabilidade) {
  const config = getConfig();
  const doc = DocumentApp.create(`Relatorio_Lote_${codigoHabilidade}_${timestampArquivo()}`);
  const body = doc.getBody();

  body.appendParagraph(config.ESCOLA).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('RELATÓRIO DE CORREÇÃO EM LOTE — PEDAGOGO.AI')
    .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Gerado em: ${dataHoje()} | Habilidade: ${codigoHabilidade}`).setItalic(true);
  body.appendHorizontalRule();

  body.appendParagraph(`Enunciado: ${enunciado}`);
  body.appendParagraph(`Total de redações corrigidas: ${resultados.length}`);

  if (resultados.length > 0) {
    const notas = resultados.map(r => r.nota);
    const media = notas.reduce((a, b) => a + b, 0) / notas.length;
    body.appendParagraph(`Média geral: ${media.toFixed(1)}`);

    body.appendParagraph('\nDETALHAMENTO POR ALUNO:').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph('⚠️ Todas as notas são SUGESTÕES e requerem validação do professor.').setBold(true);

    resultados.sort((a, b) => a.nota - b.nota);
    resultados.forEach((r, i) => {
      body.appendParagraph(`${i + 1}. ${r.nome}: ${r.nota} pts`);
    });
  }

  doc.saveAndClose();

  // Salvar na pasta de relatórios
  try {
    const idResultados = config.DRIVE.RESULTADOS;
    if (idResultados) {
      const pastaResultados = DriveApp.getFolderById(idResultados);
      const pastaRel = buscarOuCriarPasta('Relatorios_Analiticos', pastaResultados);
      const arquivo = DriveApp.getFileById(doc.getId());
      pastaRel.addFile(arquivo);
      DriveApp.getRootFolder().removeFile(arquivo);
    }
  } catch (e) {
    registrarLog('ALERTA', 'Relatório de lote não movido para pasta: ' + e.message);
  }

  return doc.getUrl();
}

// ============================================================
// GABARITO
// ============================================================

/**
 * Recupera o gabarito de uma prova do Drive (pasta protegida).
 *
 * @param {string} idGabarito - ID do Google Doc do gabarito
 * @returns {Object} Dados estruturados do gabarito
 */
function buscarGabarito(idGabarito) {
  const config = getConfig();

  // Buscar na planilha BANCO_QUESTOES aba Gabaritos
  const dados = lerAba(config.SHEETS.BANCO_QUESTOES, 'Gabaritos');
  const linhaGabarito = dados.slice(1).find(l => String(l[0]) === idGabarito);

  if (!linhaGabarito) {
    throw new Error(`Gabarito não encontrado: ${idGabarito}`);
  }

  const idsQuestoes = String(linhaGabarito[6] || '').split(';').filter(id => id.trim());

  // Buscar questões do banco
  const questoesObj = [];
  const questoesDis = [];
  const habilidades = [];
  const dadosBanco = lerBancoQuestoes({});

  idsQuestoes.forEach(idQ => {
    const questao = dadosBanco.find(q => String(q[0]) === idQ.trim());
    if (questao) {
      const obj = {
        id:         questao[0],
        tipo:       questao[1],
        habilidade: questao[4],
        dificuldade:questao[6],
        gabarito:   questao[9],
        rubrica:    questao[10]
      };
      if (questao[1] === TIPOS_QUESTAO.OBJETIVA)   questoesObj.push(obj);
      if (questao[1] === TIPOS_QUESTAO.DISCURSIVA)  questoesDis.push(obj);
      if (!habilidades.find(h => h.codigo === questao[4])) {
        habilidades.push({ codigo: questao[4] });
      }
    }
  });

  return {
    id:                idGabarito,
    titulo:            String(linhaGabarito[1]),
    turma:             String(linhaGabarito[2]),
    componente:        String(linhaGabarito[3]),
    bimestre:          String(linhaGabarito[4]),
    questoesObjetivas: questoesObj,
    questoesDiscursivas: questoesDis,
    totalObjetivas:    parseInt(linhaGabarito[7], 10) || 0,
    totalDiscursivas:  parseInt(linhaGabarito[8], 10) || 0,
    pesoObjetivo:      parseFloat(linhaGabarito[9]) || 0.7,
    pesoDiscursivo:    parseFloat(linhaGabarito[10]) || 0.3,
    notaMaxima:        parseFloat(linhaGabarito[11]) || 10,
    habilidades
  };
}
