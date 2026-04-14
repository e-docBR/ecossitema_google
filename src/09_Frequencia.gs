/**
 * PEDAGOGO.AI — Módulo de Frequência e Gestão de Alunos (Bloco 5)
 * Arquivo: 09_Frequencia.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Controle de frequência escolar com alertas automáticos (LDBEN Art. 24).
 * Cadastro de alunos com suporte a NEE e campos EJA específicos.
 * Conformidade LGPD para dados sensíveis.
 *
 * Referência: Bloco 5.1, 5.2 do prompt mestre
 */

// ============================================================
// CONTROLE DE FREQUÊNCIA (Bloco 5.2)
// ============================================================

/**
 * Handler de trigger onFormSubmit para formulário de chamada diária.
 * Registra presença/falta e dispara alertas automáticos.
 *
 * @param {Object} e - Evento onFormSubmit do Google Forms
 */
function registrarFrequenciaFormsAutomatico(e) {
  try {
    const resposta = e.response;
    const itens = resposta.getItemResponses();

    const turma = String(itens[0].getResponse()).trim();
    const componente = itens.length > 1 ? String(itens[1].getResponse()).trim() : '';
    const data = formatarData(resposta.getTimestamp(), 'dd/MM/yyyy');

    registrarLog('INFO', `Chamada recebida: ${turma} | ${data}`);

    // Registrar P/F para cada aluno (a partir do item 2 do formulário)
    const itensChamada = componente ? itens.slice(2) : itens.slice(1);
    itensChamada.forEach(item => {
      const nomeAluno = item.getItem().getTitle().trim();
      const presenca  = String(item.getResponse()).trim().toUpperCase();  // 'P' ou 'F'
      lancarFrequencia(turma, data, nomeAluno, presenca, componente);
    });

    // Verificar alunos no limite de faltas (LDBEN Art. 24)
    verificarLimiteFaltas(turma);

  } catch (e) {
    registrarLog('ERRO', 'Falha ao processar formulário de chamada: ' + e.message, e.stack);
  }
}

/**
 * Lança frequência de um aluno na planilha TURMAS_ALUNOS aba 'Frequência'.
 *
 * @param {string} turma      - Código da turma
 * @param {string} data       - Data no formato dd/MM/yyyy
 * @param {string} nomeAluno  - Nome completo do aluno
 * @param {string} presenca   - 'P' (presente) ou 'F' (falta)
 * @param {string} [componente] - Componente curricular (opcional)
 */
function lancarFrequencia(turma, data, nomeAluno, presenca, componente) {
  const config = getConfig();
  const professor = getUsuarioAtivo();

  // Buscar ID de matrícula pelo nome (para usar o ID, não o nome, na frequência)
  const alunos = lerTurmasAlunos(turma);
  const aluno = alunos.find(a => String(a[1] || '').trim().toLowerCase() === nomeAluno.toLowerCase());
  const idMatricula = aluno ? String(aluno[0]) : '';

  escreverLinha(config.SHEETS.TURMAS_ALUNOS, 'Frequência', [
    data,
    turma,
    componente || '',
    professor,
    '',  // Total de aulas (calculado depois via fórmula)
    idMatricula,
    nomeAluno,
    presenca === 'P' ? 'P' : 'F',
    ''   // Observação
  ]);
}

/**
 * Verifica se algum aluno da turma atingiu o limite de faltas (LDBEN Art. 24).
 * Envia alertas preventivos aos 20% e alertas críticos aos 25%.
 *
 * @param {string} turma - Código da turma a verificar
 */
function verificarLimiteFaltas(turma) {
  const config = getConfig();
  const frequencias = buscarFrequenciasTurma(turma);
  const limiteAlerta = config.PEDAGOGICO.PERCENTUAL_FALTA_ALERTA;
  const limiteCritico = config.PEDAGOGICO.PERCENTUAL_FALTA_CRITICO;

  const alertas = frequencias.filter(a => a.percentualFalta >= limiteAlerta);

  if (alertas.length > 0) {
    const criticos = alertas.filter(a => a.percentualFalta >= limiteCritico);
    const preventivos = alertas.filter(a => a.percentualFalta < limiteCritico);

    // Montar mensagem de alerta
    let corpoEmail = `<p>Os seguintes alunos da turma <strong>${turma}</strong> estão com frequência crítica:</p>`;

    if (criticos.length > 0) {
      corpoEmail += `<h3 style="color: #c5221f;">🔴 CRÍTICO — Acima de ${(limiteCritico * 100).toFixed(0)}% de faltas (risco de reprovação):</h3><ul>`;
      criticos.forEach(a => {
        corpoEmail += `<li>${a.nomeAluno}: ${formatarPercentual(a.percentualFalta)} de faltas (${a.totalFaltas} faltas em ${a.totalAulas} aulas)</li>`;
      });
      corpoEmail += '</ul>';
    }

    if (preventivos.length > 0) {
      corpoEmail += `<h3 style="color: #e37400;">🟡 ATENÇÃO — Entre ${(limiteAlerta * 100).toFixed(0)}% e ${(limiteCritico * 100).toFixed(0)}% de faltas:</h3><ul>`;
      preventivos.forEach(a => {
        corpoEmail += `<li>${a.nomeAluno}: ${formatarPercentual(a.percentualFalta)} de faltas</li>`;
      });
      corpoEmail += '</ul>';
    }

    corpoEmail += `<p><em>Alertas gerados automaticamente em ${dataHoje()} — LDBEN Art. 24</em></p>`;

    // Enviar para coordenação
    enviarEmailAlerta(
      config.EMAIL.COORDENACAO,
      `Alerta de Frequência — Turma ${turma} — ${criticos.length} alunos em risco`,
      corpoEmail
    );

    registrarLog(
      criticos.length > 0 ? 'ALERTA' : 'INFO',
      `Frequência: ${criticos.length} críticos, ${preventivos.length} preventivos na turma ${turma}`
    );
  }
}

/**
 * Calcula e agrega os dados de frequência de todos os alunos de uma turma.
 *
 * @param {string} turma - Código da turma
 * @returns {Array} Lista de objetos com frequência por aluno
 */
function buscarFrequenciasTurma(turma) {
  const config = getConfig();
  const dados = lerAba(config.SHEETS.TURMAS_ALUNOS, 'Frequência');
  const linhas = dados.slice(1);

  // Filtrar por turma
  const linhasTurma = linhas.filter(l => String(l[1] || '').trim() === turma);

  // Agrupar por aluno
  const porAluno = {};
  linhasTurma.forEach(linha => {
    const nomeAluno = String(linha[6] || '').trim();
    if (!nomeAluno) return;

    if (!porAluno[nomeAluno]) {
      porAluno[nomeAluno] = { nomeAluno, totalAulas: 0, totalFaltas: 0 };
    }
    porAluno[nomeAluno].totalAulas++;
    if (String(linha[7]).trim().toUpperCase() === 'F') {
      porAluno[nomeAluno].totalFaltas++;
    }
  });

  return Object.values(porAluno).map(a => ({
    ...a,
    percentualFalta: a.totalAulas > 0 ? a.totalFaltas / a.totalAulas : 0
  }));
}

/**
 * Calcula o percentual de falta atual de um aluno específico.
 *
 * @param {string} nomeAluno - Nome do aluno
 * @param {string} turma     - Código da turma
 * @returns {number} Percentual de faltas (0 a 1)
 */
function calcularPercentualFalta(nomeAluno, turma) {
  const frequencias = buscarFrequenciasTurma(turma);
  const aluno = frequencias.find(a => a.nomeAluno.toLowerCase() === nomeAluno.toLowerCase());
  return aluno ? aluno.percentualFalta : 0;
}

// ============================================================
// CADASTRO DE ALUNOS (Bloco 5.1)
// ============================================================

/**
 * Registra a matrícula de um novo aluno no sistema.
 * Valida dados obrigatórios e aplica regras LGPD para campos sensíveis.
 *
 * @param {Object} dadosAluno - Perfil completo do aluno
 * @throws {Error} Se dados obrigatórios estiverem ausentes
 */
function matricularAluno(dadosAluno) {
  _validarDadosMatricula(dadosAluno);

  const config = getConfig();
  const sequencia = _obterProximoNumeroMatricula();
  const id = gerarIDMatricula(sequencia);

  const linha = [
    id,
    dadosAluno.nomeCompleto,
    dadosAluno.dataNascimento ? formatarData(new Date(dadosAluno.dataNascimento), 'dd/MM/yyyy') : '',
    dadosAluno.turma,
    dadosAluno.turno || 'Vespertino',
    dadosAluno.segmento,
    dadosAluno.responsavel || '',
    dadosAluno.contatoWhatsApp || '',      // Restrito
    dadosAluno.emailResponsavel || '',     // Restrito
    dadosAluno.possuiNEE ? 'Sim' : 'Não',
    dadosAluno.tipoNEE || '',              // SENSÍVEL — acesso apenas coordenação
    dadosAluno.laudoMedico ? 'Sim' : 'Não', // SENSÍVEL — apenas flag, nunca o laudo em si
    dadosAluno.requerPEI ? 'Sim' : 'Não', // SENSÍVEL
    dadosAluno.observacoesPedagogicas || '', // Restrito
    'Ativo',
    dadosAluno.faixaEtariaEJA || '',
    dadosAluno.escolaridadeAnteriorEJA || '',
    dadosAluno.motivacaoRetornoEJA || '',
    dadosAluno.turnoTrabalhoEJA || ''
  ];

  escreverLinha(config.SHEETS.TURMAS_ALUNOS, 'Matrículas', linha);

  registrarLog('INFO', `Aluno matriculado: ID ${id}`, `Turma: ${dadosAluno.turma}`);
  return id;
}

/**
 * Valida os campos obrigatórios de uma matrícula.
 * @private
 */
function _validarDadosMatricula(dados) {
  const erros = [];
  if (!dados.nomeCompleto) erros.push('Nome completo é obrigatório');
  if (!dados.turma)        erros.push('Turma é obrigatória');
  if (!dados.segmento)     erros.push('Segmento de ensino é obrigatório');

  // Validações específicas EJA
  if (dados.segmento && dados.segmento.includes('EJA')) {
    if (!dados.faixaEtariaEJA) erros.push('Faixa etária é obrigatória para EJA');
  }

  if (erros.length > 0) {
    throw new Error(`Erros na matrícula:\n• ${erros.join('\n• ')}`);
  }
}

function _obterProximoNumeroMatricula() {
  const config = getConfig();
  const dados = lerAba(config.SHEETS.TURMAS_ALUNOS, 'Matrículas');
  return Math.max(1, dados.length);
}

// ============================================================
// GERAÇÃO DE FORMULÁRIO DE CHAMADA
// ============================================================

/**
 * Cria programaticamente um Google Form de chamada para uma turma.
 * O formulário lista todos os alunos ativos da turma como perguntas de múltipla escolha.
 *
 * @param {string} turma      - Código da turma
 * @param {string} [data]     - Data da chamada (padrão: hoje)
 * @returns {string} URL do formulário criado
 */
function gerarChamadaForm(turma, data) {
  const dataFormatada = data || dataHoje();
  const alunos = lerTurmasAlunos(turma).filter(a => String(a[14]) === 'Ativo');

  if (alunos.length === 0) {
    throw new Error(`Nenhum aluno ativo encontrado na turma: ${turma}`);
  }

  const form = FormApp.create(`Chamada — ${turma} — ${dataFormatada}`);
  form.setDescription(`Chamada automática gerada pelo PEDAGOGO.AI | ${dataFormatada}`);
  form.setCollectEmail(true);

  // Campo de turma (preenchido automaticamente)
  const campoTurma = form.addListItem();
  campoTurma.setTitle('Turma');
  campoTurma.setChoiceValues([turma]);
  campoTurma.setRequired(true);

  // Campo de componente
  const campoComp = form.addTextItem();
  campoComp.setTitle('Componente Curricular');
  campoComp.setRequired(true);

  // Um campo por aluno
  alunos.forEach(aluno => {
    const nome = String(aluno[1] || '').trim();
    if (!nome) return;

    const item = form.addMultipleChoiceItem();
    item.setTitle(nome);
    item.setChoices([
      item.createChoice('P — Presente'),
      item.createChoice('F — Falta')
    ]);
    item.setRequired(true);
  });

  registrarLog('INFO', `Formulário de chamada criado: ${turma} | ${dataFormatada}`);
  return form.getPublishedUrl();
}

// ============================================================
// GERAÇÃO DE PEI/PDI PARA ALUNOS COM NEE (Bloco 6.1)
// ============================================================

/**
 * Gera um Plano Educacional Individualizado (PEI) ou Plano de
 * Desenvolvimento Individual (PDI) para alunos com Necessidades
 * Educacionais Especiais via Gemini.
 *
 * O documento é salvo em Drive/04_ALUNOS/PEI_PDI/
 *
 * @param {Object} dadosAluno
 * @param {string} dadosAluno.nomeCompleto  - Nome do aluno
 * @param {string} dadosAluno.turma        - Turma atual
 * @param {string} dadosAluno.segmento     - Segmento de ensino
 * @param {string} dadosAluno.tipoNEE      - Tipo(s) de NEE (TEA, DI, DA, DF, TDAH, Altas_Habilidades)
 * @param {string[]} dadosAluno.componentes - Componentes curriculares a adaptar
 * @param {string} [dadosAluno.observacoes] - Observações pedagógicas prévias
 * @param {boolean} [dadosAluno.isEJA]     - Se aluno é da EJA
 * @returns {string} URL do Google Doc do PEI/PDI gerado
 */
function gerarPEI(dadosAluno) {
  // Verificar permissão — PEI contém dados sensíveis (LGPD)
  verificarPermissao(PAPEIS.COORDENADOR);

  if (!dadosAluno.nomeCompleto || !dadosAluno.tipoNEE) {
    throw new Error('Nome do aluno e tipo de NEE são obrigatórios para geração do PEI.');
  }

  const config = getConfig();
  const componentesTexto = (dadosAluno.componentes || ['Todos']).join(', ');

  const prompt = `Elabore um Plano Educacional Individualizado (PEI) completo para o seguinte aluno:

DADOS DO ALUNO:
• Nome: ${dadosAluno.nomeCompleto}
• Turma: ${dadosAluno.turma}
• Segmento: ${dadosAluno.segmento}
• Necessidade Educacional Especial: ${dadosAluno.tipoNEE}
• Componentes a adaptar: ${componentesTexto}
${dadosAluno.observacoes ? `• Observações prévias: ${dadosAluno.observacoes}` : ''}
${dadosAluno.isEJA ? '• ALUNO EJA: adaptar para contexto adulto' : ''}

ESTRUTURA OBRIGATÓRIA DO PEI:

1. IDENTIFICAÇÃO
   Escola: ${config.ESCOLA} | Turma | Segmento | Data de elaboração
   Responsável pela elaboração | Professor(es) da turma

2. CARACTERIZAÇÃO DO ALUNO
   Breve descrição do perfil, potencialidades e desafios
   (NÃO incluir diagnósticos médicos — apenas aspectos pedagógicos)

3. AVALIAÇÃO PEDAGÓGICA INICIAL
   O que o aluno já demonstra saber/fazer em cada componente
   Nível de autonomia em atividades escolares
   Habilidades sociais e comunicativas

4. OBJETIVOS DE APRENDIZAGEM INDIVIDUALIZADOS
   Para cada componente, definir:
   - Objetivos gerais (semestre/ano)
   - Objetivos específicos (bimestre)
   - Alinhamento com as habilidades BNCC (indicar códigos quando possível)
   - Níveis de desempenho esperados (usar Bloom adaptado)

5. ESTRATÉGIAS PEDAGÓGICAS E ADAPTAÇÕES
   a) Adaptações de ACESSO: recursos, materiais, disposição em sala
   b) Adaptações CURRICULARES: simplificação de conteúdo, tempo extra
   c) Adaptações METODOLÓGICAS: estratégias de ensino diferenciadas
   d) Adaptações AVALIATIVAS: instrumentos alternativos, critérios flexíveis
   Detalhar por tipo de NEE: ${dadosAluno.tipoNEE}

6. RECURSOS E MATERIAIS DE APOIO
   Lista de recursos específicos recomendados
   Tecnologias assistivas quando aplicável

7. CRONOGRAMA DE ACOMPANHAMENTO
   Datas de reavaliação (bimestral)
   Responsáveis por cada ação

8. REGISTRO DE EVOLUÇÃO
   Tabela para registro bimestral com campos:
   Bimestre | Objetivo | Resultado | Observações | Próximos Passos

9. PARTICIPAÇÃO DA FAMÍLIA
   Orientações para a família apoiar o processo em casa
   Canais de comunicação escola-família

10. ASSINATURAS
    Espaços para: Professor(es) | Coordenador(a) | Responsável | Aluno (se maior)

REGRAS:
• Use linguagem respeitosa e focada nas potencialidades do aluno
• NUNCA inclua dados médicos, laudos ou informações de saúde no documento
• Baseie-se na LBI 13.146/2015 e na Política Nacional de Educação Especial
• Para alunos EJA: valorize experiências de vida e autonomia do adulto
• O PEI deve ser um documento PRÁTICO, não apenas teórico
• Máximo 6 páginas A4`;

  const textoPEI = chamarGemini(prompt, { temperature: 0.5, maxOutputTokens: 6144 });

  // Criar Google Doc
  const titulo = `PEI_${dadosAluno.nomeCompleto.split(' ').slice(0, 2).join('_')}_${formatarData(new Date(), 'yyyy')}`;
  const doc = DocumentApp.create(titulo);
  const body = doc.getBody();

  body.appendParagraph(config.ESCOLA).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('PLANO EDUCACIONAL INDIVIDUALIZADO — PEI').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`${config.SECRETARIA} | Gerado em: ${dataHoje()}`).setItalic(true);
  body.appendParagraph('DOCUMENTO CONFIDENCIAL — Classificação LGPD: SENSÍVEL').setBold(true);
  body.appendHorizontalRule();
  body.appendParagraph(textoPEI);

  doc.saveAndClose();

  // Salvar na pasta 04_ALUNOS/PEI_PDI/
  const idAlunos = config.DRIVE.ALUNOS;
  if (idAlunos) {
    try {
      const pastaAlunos = DriveApp.getFolderById(idAlunos);
      const pastaPEI = buscarOuCriarPasta('PEI_PDI', pastaAlunos);
      const arquivo = DriveApp.getFileById(doc.getId());
      pastaPEI.addFile(arquivo);
      DriveApp.getRootFolder().removeFile(arquivo);

      // Restringir acesso (LGPD — dado sensível)
      arquivo.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    } catch (e) {
      registrarLog('ALERTA', 'PEI não movido para pasta protegida: ' + e.message);
    }
  }

  // Atualizar flag na planilha TURMAS_ALUNOS
  try {
    const alunosBanco = lerTurmasAlunos(dadosAluno.turma);
    const alunoEncontrado = alunosBanco.find(a =>
      String(a[1] || '').trim().toLowerCase() === dadosAluno.nomeCompleto.toLowerCase()
    );
    if (alunoEncontrado) {
      atualizarLinha(
        config.SHEETS.TURMAS_ALUNOS,
        'Matrículas',
        1,  // Coluna Nome_Completo
        dadosAluno.nomeCompleto,
        { 12: 'Sim' }  // Coluna Requer_PEI → marcar como "Sim" (PEI gerado)
      );
    }
  } catch (e) {
    registrarLog('ALERTA', 'Flag PEI não atualizada na planilha: ' + e.message);
  }

  registrarLog('AUDITORIA',
    `PEI gerado para aluno com NEE`,
    `Turma: ${dadosAluno.turma} | NEE: ${dadosAluno.tipoNEE}`
  );

  return doc.getUrl();
}

/**
 * Versão do gerarPEI sem verificação de permissão (para chamada via webapp).
 * A autenticação é garantida pelo próprio contexto do webapp (doGet).
 * @param {Object} dadosAluno - Mesmos dados de gerarPEI
 * @returns {string} URL do Google Doc do PEI/PDI gerado
 */
function _gerarPEISemPermissao(dadosAluno) {
  if (!dadosAluno.nomeCompleto || !dadosAluno.tipoNEE) {
    throw new Error('Nome do aluno e tipo de NEE são obrigatórios para geração do PEI.');
  }

  const config = getConfig();
  const componentesTexto = (dadosAluno.componentes || ['Todos']).join(', ');

  const prompt = `Elabore um Plano Educacional Individualizado (PEI) completo para o seguinte aluno:

DADOS DO ALUNO:
• Nome: ${dadosAluno.nomeCompleto}
• Turma: ${dadosAluno.turma}
• Segmento: ${dadosAluno.segmento}
• Necessidade Educacional Especial: ${dadosAluno.tipoNEE}
• Componentes a adaptar: ${componentesTexto}
${dadosAluno.observacoes ? `• Observações prévias: ${dadosAluno.observacoes}` : ''}
${dadosAluno.isEJA ? '• ALUNO EJA: adaptar para contexto adulto' : ''}

ESTRUTURA OBRIGATÓRIA DO PEI:
1. IDENTIFICAÇÃO (Escola: ${config.ESCOLA} | Turma | Segmento | Data)
2. CARACTERIZAÇÃO DO ALUNO (perfil, potencialidades e desafios — sem diagnósticos médicos)
3. AVALIAÇÃO PEDAGÓGICA INICIAL (o que sabe/faz por componente, autonomia, habilidades sociais)
4. OBJETIVOS INDIVIDUALIZADOS (por componente, gerais e específicos, alinhados à BNCC)
5. ESTRATÉGIAS E ADAPTAÇÕES (acesso, curriculares, metodológicas, avaliativas p/ ${dadosAluno.tipoNEE})
6. RECURSOS E MATERIAIS DE APOIO
7. CRONOGRAMA DE ACOMPANHAMENTO (reavaliação bimestral)
8. REGISTRO DE EVOLUÇÃO (tabela bimestral)
9. PARTICIPAÇÃO DA FAMÍLIA
10. ASSINATURAS

REGRAS:
• Linguagem respeitosa focada nas potencialidades
• NUNCA inclua dados médicos ou laudos
• Baseie-se na LBI 13.146/2015
${dadosAluno.isEJA ? '• Para EJA: valorize experiências de vida e autonomia do adulto' : ''}
• Documento PRÁTICO, máximo 6 páginas A4`;

  const textoPEI = chamarGemini(prompt, { temperature: 0.5, maxOutputTokens: 6144 });

  const titulo = `PEI_${dadosAluno.nomeCompleto.split(' ').slice(0, 2).join('_')}_${formatarData(new Date(), 'yyyy')}`;
  const doc = DocumentApp.create(titulo);
  const body = doc.getBody();

  body.appendParagraph(config.ESCOLA).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('PLANO EDUCACIONAL INDIVIDUALIZADO — PEI').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`${config.SECRETARIA} | Gerado em: ${dataHoje()}`).setItalic(true);
  body.appendParagraph('DOCUMENTO CONFIDENCIAL — Classificação LGPD: SENSÍVEL').setBold(true);
  body.appendHorizontalRule();
  body.appendParagraph(textoPEI);
  doc.saveAndClose();

  const idAlunos = config.DRIVE.ALUNOS;
  if (idAlunos) {
    try {
      const pastaAlunos = DriveApp.getFolderById(idAlunos);
      const pastaPEI = buscarOuCriarPasta('PEI_PDI', pastaAlunos);
      const arquivo = DriveApp.getFileById(doc.getId());
      pastaPEI.addFile(arquivo);
      DriveApp.getRootFolder().removeFile(arquivo);
      arquivo.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    } catch (e) {
      registrarLog('ALERTA', 'PEI não movido para pasta protegida: ' + e.message);
    }
  }

  registrarLog('AUDITORIA', `PEI gerado via webapp`, `Turma: ${dadosAluno.turma} | NEE: ${dadosAluno.tipoNEE}`);
  return doc.getUrl();
}
