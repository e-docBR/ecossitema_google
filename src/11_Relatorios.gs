/**
 * PEDAGOGO.AI — Módulo de Relatórios e Dashboard (Bloco 7)
 * Arquivo: 11_Relatorios.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Geração de relatórios analíticos de turma com versões pública (anonimizada)
 * e restrita (nominal). Dashboard automático no Google Sheets.
 * Conformidade LGPD: versão pública nunca expõe nomes individuais.
 *
 * Referência: Bloco 7.1, 7.2 do prompt mestre
 */

// ============================================================
// GERAÇÃO DE RELATÓRIO (Bloco 7.1)
// ============================================================

/**
 * Gera relatório analítico completo de desempenho de uma turma.
 * Cria 2 documentos: versão pública (anonimizada) e versão do professor (nominal).
 *
 * @param {string} turma      - Identificador da turma
 * @param {string} componente - Componente curricular
 * @param {string} bimestre   - Ex: '1B_2026'
 * @returns {{ urlPublico: string, urlProfessor: string }}
 */
function gerarRelatorioTurma(turma, componente, bimestre) {
  registrarLog('INFO', `Gerando relatório: ${turma} | ${componente} | ${bimestre}`);

  // 1. Coleta de dados
  const resultados = lerResultados(turma, componente);
  if (resultados.length === 0) {
    throw new Error(`Nenhum resultado encontrado para ${turma} - ${componente} - ${bimestre}`);
  }

  const frequencias = buscarFrequenciasTurma(turma);

  // 2. Cálculo de indicadores gerais
  const indicadores = calcularIndicadoresGerais(turma, bimestre, resultados);

  // 3. Análise por habilidade BNCC
  const porHabilidade = calcularDesempenhoPorHabilidade(turma, componente, resultados);

  // 4. Identificar alunos em atenção
  const alunosAtencao = identificarAlunosAtencao(resultados);

  // 5. Gerar intervenções para habilidades críticas via Gemini
  const habilidadesCriticas = porHabilidade.filter(h => h.classificacao.status === 'Crítica');
  const intervencoes = habilidadesCriticas.length > 0
    ? sugerirIntervencoesGemini(habilidadesCriticas)
    : [];

  // 6. Criar documento do professor (com nomes)
  const urlProfessor = _criarDocRelatorio(
    { turma, componente, bimestre, indicadores, porHabilidade, alunosAtencao, intervencoes },
    false  // versão nominal
  );

  // 7. Criar versão pública (anonimizada) — sem nomes individuais
  const urlPublico = _criarDocRelatorio(
    { turma, componente, bimestre, indicadores, porHabilidade, alunosAtencao: alunosAtencao.map(a => ({ ...a, nome: anonimizarNome(a.nome) })), intervencoes },
    true  // versão pública
  );

  // 8. Atualizar Dashboard
  atualizarDashboard(indicadores, porHabilidade, turma, componente, bimestre);

  registrarLog('INFO', `Relatório gerado`, `Público: ${urlPublico} | Professor: ${urlProfessor}`);
  return { urlPublico, urlProfessor };
}

// ============================================================
// CÁLCULO DE INDICADORES (Bloco 7.1 itens 2-3)
// ============================================================

/**
 * Calcula indicadores gerais de desempenho da turma.
 *
 * @param {string} turma      - Turma
 * @param {string} bimestre   - Bimestre
 * @param {Array[][]} resultados - Dados brutos da planilha RESULTADOS
 * @returns {Object} Indicadores calculados
 */
function calcularIndicadoresGerais(turma, bimestre, resultados) {
  const notas = resultados.map(r => parseFloat(r[5]) || 0);
  const config = getConfig();
  const faixas = config.PEDAGOGICO.FAIXAS_NOTAS;

  const total = notas.length;
  const media = total > 0 ? notas.reduce((a, b) => a + b, 0) / total : 0;

  return {
    turma,
    bimestre,
    totalAvaliados:    total,
    media:             parseFloat(media.toFixed(2)),
    distribuicao: {
      insuficiente: notas.filter(n => n < faixas.BASICO.min).length,
      basico:       notas.filter(n => n >= faixas.BASICO.min && n < faixas.ADEQUADO.min).length,
      adequado:     notas.filter(n => n >= faixas.ADEQUADO.min && n < faixas.AVANCADO.min).length,
      avancado:     notas.filter(n => n >= faixas.AVANCADO.min).length
    },
    percentualAprovacao: total > 0
      ? notas.filter(n => n >= config.PEDAGOGICO.NOTA_APROVACAO).length / total
      : 0
  };
}

/**
 * Calcula desempenho por habilidade BNCC com classificação semáforo.
 *
 * @param {string} turma      - Turma
 * @param {string} componente - Componente
 * @param {Array[][]} resultados - Dados brutos
 * @returns {Array} Lista de habilidades com percentual e classificação
 */
function calcularDesempenhoPorHabilidade(turma, componente, resultados) {
  // Extrair habilidades de todos os resultados
  const todasHabilidades = {};
  resultados.forEach(linha => {
    const habilidadesCriticas = String(linha[8] || '').split(';').map(h => h.trim()).filter(h => h);
    habilidadesCriticas.forEach(hab => {
      todasHabilidades[hab] = todasHabilidades[hab] || { codigo: hab, totalAlunos: 0, alunosComErro: 0 };
      todasHabilidades[hab].totalAlunos++;
      todasHabilidades[hab].alunosComErro++;  // Está na lista de críticas = teve erro nesta habilidade
    });
  });

  return Object.values(todasHabilidades).map(h => {
    const percentualAcerto = h.totalAlunos > 0 ? 1 - (h.alunosComErro / h.totalAlunos) : 1;
    return {
      ...h,
      percentualAcerto,
      classificacao: classificarDesempenhoHabilidade(percentualAcerto)
    };
  }).sort((a, b) => a.percentualAcerto - b.percentualAcerto);  // Ordenar pior primeiro
}

/**
 * Identifica alunos em situação de atenção (nota < 5 ou habilidades críticas).
 * @param {Array[][]} resultados - Dados brutos
 * @returns {Array} Alunos em atenção
 */
function identificarAlunosAtencao(resultados) {
  const config = getConfig();
  return resultados
    .filter(linha => parseFloat(linha[5]) < config.PEDAGOGICO.NOTA_APROVACAO)
    .map(linha => ({
      nome:             String(linha[1]),
      turma:            String(linha[2]),
      nota:             parseFloat(linha[5]),
      habilidadesCrit:  String(linha[8] || '').split(';').filter(h => h.trim())
    }))
    .sort((a, b) => a.nota - b.nota);
}

/**
 * Sugere intervenções pedagógicas para habilidades críticas via Gemini.
 *
 * @param {Array} habilidadesCriticas - Habilidades com classificação Crítica
 * @returns {Array} Intervenções sugeridas por habilidade
 */
function sugerirIntervencoesGemini(habilidadesCriticas) {
  if (!habilidadesCriticas || habilidadesCriticas.length === 0) return [];

  const listaHabilidades = habilidadesCriticas.map(h => {
    try {
      const info = buscarHabilidadeBNCC(h.codigo);
      return `• ${info.codigo} — ${info.descricao} (${formatarPercentual(h.percentualAcerto)} de acertos)`;
    } catch(e) {
      return `• ${h.codigo} (${formatarPercentual(h.percentualAcerto)} de acertos)`;
    }
  }).join('\n');

  const prompt = `Como pedagogo especialista, sugira intervenções para as seguintes habilidades BNCC com baixo desempenho:

${listaHabilidades}

Para CADA habilidade, forneça:
1. Uma estratégia de retomada do conteúdo (atividade prática de 50 minutos)
2. Uma atividade de reforço específica (para casa ou aula de apoio)
3. Um recurso didático complementar (livro, vídeo, jogo educativo)

Use linguagem pedagógica acessível para professores do Ensino Fundamental público.`;

  const resposta = chamarGemini(prompt, { temperature: 0.5 });
  return [{ habilidades: habilidadesCriticas.map(h => h.codigo), intervencoes: resposta }];
}

// ============================================================
// DASHBOARD (Bloco 7.2)
// ============================================================

/**
 * Atualiza os dados calculados na aba Dashboard da planilha RESULTADOS.
 *
 * @param {Object} indicadores  - Indicadores gerais calculados
 * @param {Array}  porHabilidade - Desempenho por habilidade
 * @param {string} turma        - Turma
 * @param {string} componente   - Componente
 * @param {string} bimestre     - Bimestre
 */
function atualizarDashboard(indicadores, porHabilidade, turma, componente, bimestre) {
  const config = getConfig();
  if (!config.SHEETS.RESULTADOS) return;

  const consolidadas = porHabilidade.filter(h => h.classificacao.status === 'Consolidada').length;
  const criticas     = porHabilidade.filter(h => h.classificacao.status === 'Crítica').length;

  const linha = [
    turma,
    componente,
    bimestre,
    indicadores.media,
    formatarPercentual(indicadores.percentualAprovacao),
    formatarPercentual(indicadores.distribuicao.insuficiente / (indicadores.totalAvaliados || 1)),
    '',  // Taxa de participação (calculada via fórmula)
    consolidadas,
    criticas,
    dataHoje()
  ];

  try {
    escreverLinha(config.SHEETS.RESULTADOS, 'Dashboard', linha);
  } catch (e) {
    registrarLog('ALERTA', 'Erro ao atualizar Dashboard: ' + e.message);
  }
}

// ============================================================
// GERAÇÃO DE DOCUMENTO
// ============================================================

function _criarDocRelatorio(dados, ehPublico) {
  const sufixo = ehPublico ? '_Publico' : '_Professor';
  const titulo = `Relatorio_${dados.turma}_${dados.componente}_${dados.bimestre}${sufixo}`;
  const doc = DocumentApp.create(titulo);
  const body = doc.getBody();
  const config = getConfig();

  // 1. Cabeçalho
  body.appendParagraph(config.ESCOLA).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(`${config.SECRETARIA}`).setItalic(true);
  body.appendHorizontalRule();
  body.appendParagraph(`RELATÓRIO DE DESEMPENHO — ${dados.turma} | ${dados.componente} | ${dados.bimestre}`)
    .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Gerado em: ${dataHoje()}${ehPublico ? ' — VERSÃO PÚBLICA (dados anonimizados)' : ''}`).setItalic(true);

  // 2. Indicadores Gerais
  body.appendParagraph('1. INDICADORES GERAIS DA TURMA').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  const ind = dados.indicadores;
  body.appendParagraph(`• Total de alunos avaliados: ${ind.totalAvaliados}`);
  body.appendParagraph(`• Média da turma: ${ind.media}`);
  body.appendParagraph(`• Distribuição: Avançado: ${ind.distribuicao.avancado} | Adequado: ${ind.distribuicao.adequado} | Básico: ${ind.distribuicao.basico} | Insuficiente: ${ind.distribuicao.insuficiente}`);
  body.appendParagraph(`• Percentual de aprovação: ${formatarPercentual(ind.percentualAprovacao)}`);

  // 3. Por Habilidade
  body.appendParagraph('2. ANÁLISE POR HABILIDADE BNCC').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  dados.porHabilidade.forEach(h => {
    body.appendParagraph(
      `${h.classificacao.emoji} ${h.codigo}: ${formatarPercentual(h.percentualAcerto)} acertos — ${h.classificacao.status}`
    );
  });

  // 4. Alunos em atenção (nominal apenas para versão do professor)
  if (dados.alunosAtencao.length > 0) {
    body.appendParagraph('3. ALUNOS EM SITUAÇÃO DE ATENÇÃO').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    if (ehPublico) {
      body.appendParagraph(`${dados.alunosAtencao.length} aluno(s) com nota abaixo de 6,0. Detalhes na versão do professor.`).setItalic(true);
    } else {
      dados.alunosAtencao.forEach(a => {
        body.appendParagraph(`• ${a.nome}: ${a.nota} — Habilidades críticas: ${a.habilidadesCrit.join(', ') || 'nenhuma'}`);
      });
    }
  }

  // 5. Intervenções sugeridas
  if (dados.intervencoes.length > 0) {
    body.appendParagraph('4. INTERVENÇÕES PEDAGÓGICAS SUGERIDAS').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    dados.intervencoes.forEach(int => {
      body.appendParagraph(int.intervencoes);
    });
  }

  doc.saveAndClose();
  return salvarRelatorio(doc.getId(), dados.turma, ehPublico);
}
