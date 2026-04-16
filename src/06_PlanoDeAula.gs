/**
 * PEDAGOGO.AI — Módulo de Planos de Aula (Bloco 2)
 * Arquivo: 06_PlanoDeAula.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Geração automática de planos de aula BNCC-alinhados via Gemini.
 * Suporta modalidades: EF I, EF II, EJA Seg. I e II.
 * Inclui adaptações para NEE (PEI inline) e EJA (Paulo Freire).
 *
 * Referência: Bloco 2.1, 2.2, 2.3 do prompt mestre
 */

// ============================================================
// ESTRUTURA OBRIGATÓRIA DO PLANO (Bloco 2.1)
// ============================================================

/**
 * Gera um plano de aula completo e salva como Google Doc.
 * Validação BNCC obrigatória antes de qualquer chamada ao Gemini.
 *
 * @param {Object} dados - Dados do formulário de plano de aula
 * @param {string} dados.componente     - Ex: 'Língua Portuguesa'
 * @param {string} dados.ano            - Ex: '6º Ano', 'EJA Segmento II'
 * @param {string} dados.turma          - Ex: 'Turma A — Vespertino'
 * @param {number} dados.duracao        - Duração em minutos (50 ou múltiplo)
 * @param {string} dados.tema           - Tema/conteúdo central
 * @param {string} dados.codigoHabilidade - Código BNCC (ex: 'EF06LP05')
 * @param {string[]} dados.recursos     - Recursos disponíveis
 * @param {boolean} dados.isEJA         - Se turma é EJA
 * @param {boolean} dados.possuiNEE     - Se há alunos com NEE na turma
 * @param {string} dados.tipoNEE        - Tipo(s) de NEE presentes
 * @returns {string} URL do Google Doc gerado
 */
function gerarPlanoDeAula(dados) {
  // 1. VALIDAÇÃO BNCC — regra inviolável do sistema
  if (!validarHabilidadeExiste(dados.codigoHabilidade)) {
    throw new Error(
      `Código BNCC inválido ou não cadastrado: "${dados.codigoHabilidade}".\n` +
      `Use apenas habilidades do catálogo MASTER_BNCC.\n` +
      `Formatos aceitos: EF06LP05 (ano único) ou EF69LP01 (range de anos).`
    );
  }

  registrarLog('INFO', `Gerando plano de aula: ${dados.tema}`, `Habilidade: ${dados.codigoHabilidade}`);

  // 2. Construir o prompt completo
  const prompt = construirPromptPlano(dados);

  // 3. Chamar Gemini
  const textoPlano = chamarGemini(prompt, {
    temperature:     0.7,
    maxOutputTokens: 4096
  });

  // 4. Criar Google Doc
  const nomePasta = `${formatarData(new Date(), 'yyyy')}_${dados.turma}_${dados.componente}`.replace(/[^a-zA-Z0-9_À-ú ]/g, '_');
  const tituloDoc = `Plano_${dados.codigoHabilidade}_${dados.tema.substring(0, 40)}`;
  const urlDoc = salvarDocumentoPlano(tituloDoc, textoPlano, nomePasta);

  registrarLog('INFO', `Plano gerado com sucesso: ${tituloDoc}`, urlDoc);
  return urlDoc;
}

/**
 * Constrói o prompt completo para geração do plano de aula.
 * Valida o código BNCC e busca a descrição real antes de montar o prompt.
 *
 * @param {Object} dados - Dados do formulário
 * @returns {string} Prompt formatado para o Gemini
 */
function construirPromptPlano(dados) {
  // Busca SEMPRE os dados reais da BNCC — nunca usa o código diretamente
  const habilidade = buscarHabilidadeBNCC(dados.codigoHabilidade);
  const descritoresSAEB = buscarDescritoresSAEB(dados.codigoHabilidade);

  const recursosFormatados = (dados.recursos || []).join(', ') || 'lousa e quadro branco';
  const aulasPorDuracao = Math.round((dados.duracao || 50) / 50);

  let prompt = `INSTRUÇÃO: Gere um plano de aula COMPLETO seguindo EXATAMENTE a estrutura de 9 seções abaixo.

DADOS DO PLANO:
• Escola: Colégio Municipal de Itabatan — SEME/Mucuri-BA
• Componente Curricular: ${dados.componente}
• Ano/Série: ${dados.ano}
• Turma: ${dados.turma}
• Duração: ${dados.duracao || 50} minutos (${aulasPorDuracao} aula${aulasPorDuracao > 1 ? 's' : ''} de 50 min)
• Tema/Conteúdo Central: ${dados.tema}
• Habilidade BNCC: ${habilidade.codigo} — ${habilidade.descricao}
• Campo Temático: ${habilidade.campoTematico}
• Nível Bloom: ${habilidade.nivelBloom}
• Recursos Disponíveis: ${recursosFormatados}
${descritoresSAEB.length > 0 ? `• Descritores SAEB Relacionados: ${descritoresSAEB.join('; ')}` : ''}

ESTRUTURA OBRIGATÓRIA — use exatamente estas 9 seções com numeração:

1. IDENTIFICAÇÃO
   Escola, professor (campo para preenchimento), turma, data, duração, componente

2. TEMA E HABILIDADES BNCC
   Código: ${habilidade.codigo}
   Descrição completa: ${habilidade.descricao}

3. OBJETIVOS DE APRENDIZAGEM
   Use verbos de ação da Taxonomia de Bloom nível ${habilidade.nivelBloom}.
   Mínimo 3 objetivos específicos e mensuráveis.

4. OBJETO DO CONHECIMENTO
   Conceitos-chave alinhados ao Currículo Municipal de Mucuri-BA.

5. METODOLOGIA E SEQUÊNCIA DIDÁTICA
   Momento 1 — PROBLEMATIZAÇÃO / ENGAJAMENTO (${Math.round((dados.duracao || 50) * 0.10)} min):
   Questão motivadora, diagnose prévia, ativação de conhecimentos prévios.

   Momento 2 — DESENVOLVIMENTO (${Math.round((dados.duracao || 50) * 0.60)} min):
   Estratégia ativa, passo a passo detalhado, mediação docente.

   Momento 3 — SISTEMATIZAÇÃO (${Math.round((dados.duracao || 50) * 0.20)} min):
   Consolidação do conhecimento, registro, síntese coletiva.

   Momento 4 — AVALIAÇÃO FORMATIVA (${Math.round((dados.duracao || 50) * 0.10)} min):
   Instrumento avaliativo e critérios de análise.

6. RECURSOS DIDÁTICOS
   Lista com orientação específica de uso para: ${recursosFormatados}

7. AVALIAÇÃO
   Critérios de avaliação, instrumentos, descritores de nível de desempenho (4 níveis).

8. REFERÊNCIAS
   BNCC (BRASIL, 2018), livro didático adotado pelo PNLD vigente, links de apoio.

9. ADAPTAÇÕES PARA INCLUSÃO
   ${dados.possuiNEE ? `Turma possui alunos com NEE (${dados.tipoNEE || 'tipos a confirmar'}). Inclua bloco PEI simplificado com: a) Objetivos adaptados, b) Estratégias de acessibilidade, c) Formas alternativas de avaliação.` : 'Não há necessidade específica reportada. Inclua orientações gerais de acessibilidade.'}`;

  // Adicionar contexto EJA se aplicável
  if (dados.isEJA) {
    prompt += _construirContextoEJA(dados);
  }

  prompt += `

REGRAS DE GERAÇÃO:
• Use linguagem pedagógica clara e acessível para professores do Ensino Fundamental
• NUNCA invente habilidades BNCC ou descritores além dos fornecidos acima
• Para EJA: valorize saberes prévios do adulto, use contexto de vida real
• Para NEE: linguagem simples, exemplos concretos, múltiplas formas de representação
• Salve automaticamente em formato estruturado para Google Docs
• Máximo 4 páginas A4 de extensão`;

  return prompt;
}

/**
 * Adiciona contexto metodológico específico para turmas EJA.
 * Baseado na pedagogia dialógica de Paulo Freire (Bloco 2.1).
 *
 * @param {Object} dados - Dados do plano
 * @returns {string} Texto adicional do contexto EJA
 */
function _construirContextoEJA(dados) {
  return `

CONTEXTO EJA OBRIGATÓRIO (metodologia Paulo Freire):
• Esta é uma turma de Educação de Jovens e Adultos — adapte TODO o plano:
• Valorize e parta dos saberes prévios e experiências de vida dos adultos
• Use situações do cotidiano, mundo do trabalho e contexto local de Mucuri-BA
• Evite atividades infantilizadas — use linguagem respeitosa com adultos
• Preveja possibilidade de ausências por trabalho (planeje atividades autônomas)
• Metodologia dialógica: o professor é mediador, não o único detentor do saber
• Objetivos devem conectar o conteúdo à vida prática imediata do adulto
• Avaliação: considere o processo e o esforço, não apenas o produto final`;
}

/**
 * Handler para submissão do Google Form de solicitação de plano de aula.
 * Chamado automaticamente pelo trigger onFormSubmit.
 *
 * @param {Object} e - Evento do formulário
 */
function processarSubmissaoFormularioPlano(e) {
  try {
    const resposta = e.response;
    const itens = resposta.getItemResponses();

    // Mapear respostas do formulário (Bloco 2.3)
    const dados = _mapearRespostasFormulario(itens);

    registrarLog('INFO', `Plano solicitado via formulário: ${dados.tema}`, `Turma: ${dados.turma}`);

    const url = gerarPlanoDeAula(dados);

    // Enviar e-mail de confirmação para o professor
    const emailProfessor = resposta.getRespondentEmail();
    if (emailProfessor) {
      enviarEmailAlerta(
        emailProfessor,
        `Plano de Aula Gerado: ${dados.tema}`,
        `<p>Seu plano de aula foi gerado com sucesso!</p>
         <p><strong>Habilidade BNCC:</strong> ${dados.codigoHabilidade}</p>
         <p><strong>Tema:</strong> ${dados.tema}</p>
         <p><strong>Turma:</strong> ${dados.turma}</p>
         <p><a href="${url}" style="color: #1a73e8;">Clique aqui para acessar o plano</a></p>`
      );
    }
  } catch (e) {
    registrarLog('ERRO', `Falha ao processar formulário de plano: ${e.message}`, e.stack);
  }
}

// ============================================================
// CRIAÇÃO DO GOOGLE FORM DE PLANO DE AULA (Bloco 2.3)
// ============================================================

/**
 * Cria programaticamente o Google Form para solicitação de planos de aula.
 * O formulário contém todos os campos definidos no Bloco 2.3 do prompt mestre.
 * Deve ser executado UMA VEZ durante o setup (Etapa 6 do deploy).
 *
 * @returns {string} URL do formulário criado
 */
function criarFormPlanoDeAula() {
  const config = getConfig();

  const form = FormApp.create('PEDAGOGO.AI — Solicitação de Plano de Aula');
  form.setDescription(
    'Formulário de solicitação de plano de aula automático.\n' +
    'Preencha todos os campos obrigatórios (*). O plano será gerado pelo PEDAGOGO.AI ' +
    'e enviado por e-mail em até 2 minutos.\n\n' +
    `${config.ESCOLA} | ${config.SECRETARIA}`
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(false);
  form.setConfirmationMessage(
    'Sua solicitação foi recebida! O plano de aula será gerado automaticamente ' +
    'e enviado para seu e-mail em instantes.'
  );

  // 1. Componente Curricular (lista suspensa)
  const campoComponente = form.addListItem();
  campoComponente.setTitle('Componente Curricular');
  campoComponente.setHelpText('Selecione o componente curricular do plano.');
  campoComponente.setChoiceValues([
    'Língua Portuguesa', 'Matemática', 'Ciências', 'História',
    'Geografia', 'Arte', 'Educação Física', 'Ensino Religioso',
    'Língua Inglesa'
  ]);
  campoComponente.setRequired(true);

  // 2. Ano/Série (lista suspensa)
  const campoAno = form.addListItem();
  campoAno.setTitle('Ano/Série');
  campoAno.setHelpText('Selecione o ano ou série de ensino.');
  campoAno.setChoiceValues([
    '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
    '6º Ano', '7º Ano', '8º Ano', '9º Ano',
    'EJA Segmento I', 'EJA Segmento II'
  ]);
  campoAno.setRequired(true);

  // 3. Turma (lista suspensa — sincronizado com TURMAS_ALUNOS)
  const turmasAtivas = _obterTurmasAtivas();
  const campoTurma = form.addListItem();
  campoTurma.setTitle('Turma');
  campoTurma.setHelpText('Selecione a turma. A lista é sincronizada com o cadastro.');
  campoTurma.setChoiceValues(turmasAtivas.length > 0 ? turmasAtivas : ['Turma A', 'Turma B', 'Turma C']);
  campoTurma.setRequired(true);

  // 4. Código(s) Habilidade BNCC (resposta curta com regex)
  const campoHabilidade = form.addTextItem();
  campoHabilidade.setTitle('Código(s) Habilidade BNCC');
  campoHabilidade.setHelpText('Informe o código da habilidade BNCC. Formato: EF06LP05');
  // BUG-08: anchors adicionados — sem ^...$ o padrão aceitava qualquer string que contenha EFxxXXxx
  campoHabilidade.setValidation(
    FormApp.createTextValidation()
      .requireTextMatchesPattern('^(EF|EI|EM)\\d{2}[A-Z]{2,3}\\d{2,3}$')
      .setHelpText('Formato inválido. Use: EF06LP05, EI04EF01, EM13CO01, etc.')
      .build()
  );
  campoHabilidade.setRequired(true);

  // 5. Tema / Conteúdo Central (parágrafo)
  const campoTema = form.addParagraphTextItem();
  campoTema.setTitle('Tema / Conteúdo Central');
  campoTema.setHelpText('Descreva o tema ou conteúdo principal da aula (máx. 200 caracteres).');
  campoTema.setRequired(true);

  // 6. Duração (em aulas de 50min)
  const campoDuracao = form.addScaleItem();
  campoDuracao.setTitle('Duração (em aulas de 50min)');
  campoDuracao.setHelpText('Quantas aulas de 50 minutos?');
  campoDuracao.setBounds(1, 10);
  campoDuracao.setRequired(true);

  // 7. Recursos disponíveis (caixa de seleção múltipla)
  const campoRecursos = form.addCheckboxItem();
  campoRecursos.setTitle('Recursos Disponíveis');
  campoRecursos.setChoiceValues([
    'Lousa/Quadro branco', 'Data show / Projetor', 'Celular dos alunos',
    'Laboratório de informática', 'Biblioteca', 'Material impresso',
    'Livro didático PNLD', 'Caixas de som', 'Jogos pedagógicos'
  ]);
  campoRecursos.setRequired(false);

  // 8. Há alunos com NEE na turma?
  const campoNEE = form.addMultipleChoiceItem();
  campoNEE.setTitle('Há alunos com NEE na turma?');
  campoNEE.setHelpText('NEE = Necessidades Educacionais Especiais');
  campoNEE.setChoiceValues(['Sim', 'Não', 'Não sei informar']);
  campoNEE.setRequired(true);

  // 9. Turma EJA?
  const campoEJA = form.addCheckboxItem();
  campoEJA.setTitle('Turma EJA?');
  campoEJA.setHelpText('Marque se a turma é de Educação de Jovens e Adultos.');
  campoEJA.setChoiceValues(['Sim, é turma EJA']);
  campoEJA.setRequired(false);

  // Salvar URL do formulário
  salvarPropriedade('URL_FORM_PLANO_AULA', form.getPublishedUrl());
  salvarPropriedade('ID_FORM_PLANO_AULA', form.getId());

  registrarLog('INFO', 'Formulário de Plano de Aula criado', form.getPublishedUrl());
  return form.getPublishedUrl();
}

/**
 * Obtém lista de turmas ativas da planilha para popular o Form.
 * @private
 * @returns {string[]} Nomes das turmas ativas
 */
function _obterTurmasAtivas() {
  try {
    const config = getConfig();
    if (!config.SHEETS.TURMAS_ALUNOS) return [];
    const dados = lerAba(config.SHEETS.TURMAS_ALUNOS, 'Turmas');
    // BUG-01: usar estaAtivo() em vez de comparação ad-hoc
    return dados.slice(1)
      .filter(t => estaAtivo(t[7]))
      .map(t => String(t[1] || t[0]).trim())
      .filter(t => t.length > 0);
  } catch (e) {
    return [];
  }
}

/**
 * Mapeia respostas do formulário para o objeto de dados esperado.
 * @param {ItemResponse[]} itens - Respostas do formulário
 * @returns {Object} Dados estruturados
 */
function _mapearRespostasFormulario(itens) {
  const dados = {};
  itens.forEach(item => {
    const titulo = item.getItem().getTitle().toLowerCase();
    const valor = item.getResponse();

    if (titulo.includes('componente'))   dados.componente = valor;
    if (titulo.includes('ano') || titulo.includes('série')) dados.ano = valor;
    if (titulo.includes('turma'))        dados.turma = valor;
    if (titulo.includes('tema') || titulo.includes('conteúdo')) dados.tema = valor;
    if (titulo.includes('habilidade') || titulo.includes('bncc')) dados.codigoHabilidade = String(valor).toUpperCase().trim();
    if (titulo.includes('duração'))      dados.duracao = parseInt(valor, 10) * 50;
    if (titulo.includes('recursos'))     dados.recursos = Array.isArray(valor) ? valor : [valor];
    if (titulo.includes('eja'))          dados.isEJA = String(valor).toLowerCase() === 'sim';
    if (titulo.includes('nee') || titulo.includes('inclusão')) dados.possuiNEE = String(valor).toLowerCase() === 'sim';
  });

  return dados;
}
