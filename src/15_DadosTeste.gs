/**
 * PEDAGOGO.AI — Seed de Dados Iniciais e Dados de Teste
 * Arquivo: 15_DadosTeste.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Funções para popular as planilhas-mestre com:
 *  - Catálogo inicial BNCC (habilidades reais EF Anos Finais + EJA Seg. II)
 *  - Turmas e alunos de teste para validação do sistema
 *
 * ⚠️  BNCC: Todos os códigos abaixo são reais, extraídos do documento
 *     "Base Nacional Comum Curricular — MEC/2018".
 *     Execute popularBNCCInicial() APÓS o Setup para habilitar as
 *     ferramentas de IA (buscarHabilidadeBNCC é obrigatório antes de
 *     qualquer prompt ao Gemini).
 *
 * ⚠️  TESTE: popularTurmasTeste() insere dados sintéticos identificados
 *     com o prefixo "TESTE_". Use limparDadosTeste() para removê-los
 *     antes de colocar o sistema em produção.
 */

// ============================================================
// CATÁLOGO BNCC — EF ANOS FINAIS (6º–9º) + EJA SEGMENTO II
// ============================================================

/**
 * Retorna os dados do catálogo BNCC inicial.
 * Colunas: Codigo_BNCC, Componente, Ano_Serie, Campo_Tematico,
 *           Descricao_Habilidade, Nivel_Bloom, Ativo
 * @returns {Array[][]}
 */
function _obterDadosBNCC() {
  return [
    // ── LÍNGUA PORTUGUESA ──────────────────────────────────────────
    ['EF69LP01','Língua Portuguesa','EJA Seg. II / 6º-9º Ano','Leitura',
     'Demonstrar atitude respeitosa diante de manifestações e variações linguísticas, valorizando a língua portuguesa, as línguas indígenas, crioulas e de sinais, sem preconceito linguístico.',
     'Valorizar','TRUE'],
    ['EF69LP06','Língua Portuguesa','EJA Seg. II / 6º-9º Ano','Leitura',
     'Analisar, em textos lidos ou de produção própria, a utilização de citação e discurso indireto e direto, reconhecendo os efeitos de sentido decorrentes dessas escolhas.',
     'Analisar','TRUE'],
    ['EF69LP14','Língua Portuguesa','EJA Seg. II / 6º-9º Ano','Leitura',
     'Analisar, em textos argumentativos e propositivos, os movimentos argumentativos de sustentação, refutação e negociação e a força argumentativa de cada um deles.',
     'Analisar','TRUE'],
    ['EF69LP18','Língua Portuguesa','EJA Seg. II / 6º-9º Ano','Produção de Textos',
     'Utilizar, ao produzir texto, conhecimentos linguísticos e gramaticais: ortografia, regências, concordâncias, modos e tempos verbais, pontuação etc.',
     'Aplicar','TRUE'],
    ['EF69LP25','Língua Portuguesa','EJA Seg. II / 6º-9º Ano','Produção de Textos',
     'Reconhecer as variedades da língua falada, o conceito de norma-padrão e o de preconceito linguístico, e apropriar-se da norma-padrão em situações nas quais ela é requerida.',
     'Compreender','TRUE'],
    ['EF69LP38','Língua Portuguesa','EJA Seg. II / 6º-9º Ano','Análise Linguística',
     'Utilizar e compreender, em situações de intercâmbio oral, recursos e estratégias como a tomada de turno, a construção coletiva do tópico discursivo e outros.',
     'Aplicar','TRUE'],
    ['EF67LP14','Língua Portuguesa','6º-7º Ano / EJA Seg. II','Produção de Textos',
     'Planejar, produzir, revisar, editar, reescrever e avaliar textos escritos e multissemióticos, considerando sua adequação às condições de produção do enunciado.',
     'Criar','TRUE'],
    ['EF67LP22','Língua Portuguesa','6º-7º Ano / EJA Seg. II','Análise Linguística',
     'Diferenciar as estratégias de produção dos enunciados de diferentes esferas e campos de atividade humana, reconhecendo características de texto argumentativo.',
     'Analisar','TRUE'],
    ['EF89LP06','Língua Portuguesa','8º-9º Ano / EJA Seg. II','Leitura',
     'Analisar a conjunção de recursos semióticos presentes em textos multissemióticos e sua contribuição para a produção de sentidos.',
     'Analisar','TRUE'],
    ['EF89LP13','Língua Portuguesa','8º-9º Ano / EJA Seg. II','Produção de Textos',
     'Produzir artigos de opinião, tendo em vista o contexto de produção dado, utilizando estratégias de persuasão, argumentação e sustentação da tese.',
     'Criar','TRUE'],
    ['EF89LP26','Língua Portuguesa','8º-9º Ano / EJA Seg. II','Literatura',
     'Ler, de forma autônoma e reflexiva, textos de autores de diferentes culturas e épocas, compreendendo o papel da literatura na construção da identidade cultural.',
     'Compreender','TRUE'],
    ['EF89LP33','Língua Portuguesa','8º-9º Ano / EJA Seg. II','Análise Linguística',
     'Analisar os efeitos de sentido decorrentes do uso de mecanismos de coesão e coerência em textos lidos ou produzidos, reconhecendo seu papel na progressão temática.',
     'Analisar','TRUE'],

    // ── MATEMÁTICA ─────────────────────────────────────────────────
    ['EF06MA01','Matemática','6º Ano / EJA Seg. II','Números',
     'Comparar, ordenar, ler e escrever números naturais e inteiros (incluindo os negativos), estabelecendo diferentes relações entre eles.',
     'Compreender','TRUE'],
    ['EF06MA03','Matemática','6º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas com números naturais, envolvendo as noções de divisor e múltiplo, para desenvolver o conceito de mínimo múltiplo comum (MMC) e máximo divisor comum (MDC).',
     'Aplicar','TRUE'],
    ['EF06MA07','Matemática','6º Ano / EJA Seg. II','Números',
     'Classificar números racionais em forma decimal como finitos ou infinitos periódicos e representá-los na forma fracionária.',
     'Compreender','TRUE'],
    ['EF06MA12','Matemática','6º Ano / EJA Seg. II','Álgebra',
     'Identificar a localização de pares ordenados no primeiro quadrante do plano cartesiano e utilizá-la em situações-problema.',
     'Aplicar','TRUE'],
    ['EF06MA17','Matemática','6º Ano / EJA Seg. II','Geometria',
     'Resolver e elaborar problemas de cálculo de medida de área de triângulos e de quadriláteros, utilizando as fórmulas pertinentes.',
     'Aplicar','TRUE'],
    ['EF06MA20','Matemática','6º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Calcular a média aritmética de um conjunto de dados, compreendendo-a como representante dos dados e comparando com a mediana.',
     'Aplicar','TRUE'],
    ['EF07MA01','Matemática','7º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas com números inteiros, envolvendo as quatro operações, para formular e resolver situações-problema em diferentes contextos.',
     'Aplicar','TRUE'],
    ['EF07MA07','Matemática','7º Ano / EJA Seg. II','Álgebra',
     'Compreender a ideia de variável, representada por letra ou símbolo, para expressar relação entre duas grandezas, descrever padrões e generalizar regularidades.',
     'Compreender','TRUE'],
    ['EF07MA18','Matemática','7º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas que envolvam porcentagem, como os de acréscimo e decréscimo simples, em contextos de educação financeira, entre outros.',
     'Aplicar','TRUE'],
    ['EF07MA19','Matemática','7º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas que envolvam razão e proporção com resolução pela regra de três simples ou composta.',
     'Aplicar','TRUE'],
    ['EF07MA25','Matemática','7º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Planejar e realizar pesquisa envolvendo tema da realidade social, organizar os dados em tabelas ou representações gráficas adequadas e apresentá-la.',
     'Criar','TRUE'],
    ['EF08MA01','Matemática','8º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas com números reais, em situações de contexto social e científico, reconhecendo que as medidas muitas vezes são expressas em notação científica.',
     'Aplicar','TRUE'],
    ['EF08MA06','Matemática','8º Ano / EJA Seg. II','Álgebra',
     'Resolver e elaborar problemas que possam ser representados por equações polinomiais de 1º grau, redutíveis a esta forma.',
     'Aplicar','TRUE'],
    ['EF08MA13','Matemática','8º Ano / EJA Seg. II','Álgebra',
     'Resolver e elaborar problemas que possam ser representados por equações polinomiais de 2º grau (equações quadráticas) e verificar se os resultados obtidos são adequados para o contexto.',
     'Aplicar','TRUE'],
    ['EF08MA17','Matemática','8º Ano / EJA Seg. II','Geometria',
     'Reconhecer e construir figuras obtidas por simetrias de translação, rotação e reflexão, e verificar que o processo conserva as medidas dos ângulos e das arestas.',
     'Compreender','TRUE'],
    ['EF09MA01','Matemática','9º Ano / EJA Seg. II','Números',
     'Reconhecer que a relação entre uma dízima periódica e a fração que a gerou possibilita a compreensão da estrutura do conjunto dos números racionais.',
     'Compreender','TRUE'],
    ['EF09MA08','Matemática','9º Ano / EJA Seg. II','Geometria',
     'Provar relações métricas do triângulo retângulo, entre elas o teorema de Pitágoras, utilizando, inclusive, a semelhança de triângulos.',
     'Aplicar','TRUE'],
    ['EF09MA14','Matemática','9º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Classificar uma pesquisa como probabilística ou censitária e planejar, realizar e apresentar pesquisa envolvendo tema de interesse social.',
     'Analisar','TRUE'],
    ['EF09MA15','Matemática','9º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Organizar e interpretar dados de pesquisa em tabelas e gráficos, calcular e interpretar medidas de tendência central e de dispersão.',
     'Aplicar','TRUE'],

    // ── CIÊNCIAS ───────────────────────────────────────────────────
    ['EF06CI01','Ciências','6º Ano / EJA Seg. II','Matéria e Energia',
     'Classificar como homogêneas e heterogêneas misturas envolvidas em processos produtivos e domésticos, reconhecendo as substâncias envolvidas.',
     'Analisar','TRUE'],
    ['EF06CI05','Ciências','6º Ano / EJA Seg. II','Vida e Evolução',
     'Explicar a organização básica das células, como unidade fundamental da vida, reconhecendo sua diversidade estrutural em organismos unicelulares e pluricelulares.',
     'Compreender','TRUE'],
    ['EF06CI11','Ciências','6º Ano / EJA Seg. II','Terra e Universo',
     'Identificar as diferentes camadas que compõem a Terra e as principais características dessas camadas, relacionando-as a fenômenos geológicos.',
     'Lembrar','TRUE'],
    ['EF07CI01','Ciências','7º Ano / EJA Seg. II','Vida e Evolução',
     'Concluir, com base na observação e em outras fontes de informação, que os seres vivos são constituídos por células, reconhecendo a diversidade de formas de vida na Terra.',
     'Analisar','TRUE'],
    ['EF07CI07','Ciências','7º Ano / EJA Seg. II','Vida e Evolução',
     'Caracterizar os principais ecossistemas brasileiros quanto à paisagem, ao tipo de solo, à flora e à fauna, relacionando-os aos biomas brasileiros.',
     'Compreender','TRUE'],
    ['EF08CI02','Ciências','8º Ano / EJA Seg. II','Matéria e Energia',
     'Identificar e classificar fontes de energia renováveis e não renováveis, discutindo a importância da transição para fontes renováveis.',
     'Analisar','TRUE'],
    ['EF08CI09','Ciências','8º Ano / EJA Seg. II','Matéria e Energia',
     'Elaborar explicações e argumentos, baseados em evidências, sobre a transformação de energia elétrica em mecânica, térmica e luminosa nos aparelhos eletrodomésticos.',
     'Criar','TRUE'],
    ['EF09CI01','Ciências','9º Ano / EJA Seg. II','Matéria e Energia',
     'Investigar as propriedades de ondas eletromagnéticas em seus diferentes comprimentos de onda e reconhecer seu papel nas tecnologias de comunicação e na saúde.',
     'Aplicar','TRUE'],
    ['EF09CI11','Ciências','9º Ano / EJA Seg. II','Vida e Evolução',
     'Avaliar como os processos de industrialização e a expansão das fronteiras agrícolas podem impactar os ecossistemas dos biomas brasileiros, propondo ações mitigadoras.',
     'Avaliar','TRUE'],

    // ── HISTÓRIA ───────────────────────────────────────────────────
    ['EF06HI01','História','6º Ano / EJA Seg. II','Mundo antigo',
     'Identificar diferentes formas de compreensão da noção de tempo e de periodização dos processos históricos, reconhecendo continuidades e rupturas.',
     'Lembrar','TRUE'],
    ['EF06HI06','História','6º Ano / EJA Seg. II','Mundo antigo',
     'Identificar a escravidão e outras formas de trabalho compulsório no mundo antigo, discutindo suas implicações sociais, políticas e econômicas.',
     'Compreender','TRUE'],
    ['EF07HI01','História','7º Ano / EJA Seg. II','Modernidade',
     'Discutir as motivações que levaram à formação das grandes navegações e seus resultados na integração dos continentes, incluindo seus impactos nas populações originais.',
     'Analisar','TRUE'],
    ['EF07HI05','História','7º Ano / EJA Seg. II','Modernidade',
     'Identificar as especificidades e os desdobramentos da colonização portuguesa e espanhola na América, com ênfase na escravização de indígenas e africanos.',
     'Analisar','TRUE'],
    ['EF08HI01','História','8º Ano / EJA Seg. II','Modernidade',
     'Identificar os mecanismos que levaram à crise do Antigo Regime europeu e à ascensão e expansão do liberalismo político e econômico.',
     'Compreender','TRUE'],
    ['EF08HI07','História','8º Ano / EJA Seg. II','Independências',
     'Explicar as questões históricas que motivaram os processos de independência nas Américas e suas consequências para as diferentes classes e grupos sociais.',
     'Aplicar','TRUE'],
    ['EF09HI01','História','9º Ano / EJA Seg. II','Século XX',
     'Relacionar industrialização, urbanização e imperialismo, reconhecendo as transformações pelas quais passaram as sociedades ao longo do século XIX e início do XX.',
     'Analisar','TRUE'],
    ['EF09HI08','História','9º Ano / EJA Seg. II','Século XX',
     'Descrever e analisar as transformações políticas, econômicas, sociais e culturais ocasionadas pela Primeira e pela Segunda Guerra Mundial e pela Guerra Fria.',
     'Analisar','TRUE'],

    // ── GEOGRAFIA ──────────────────────────────────────────────────
    ['EF06GE01','Geografia','6º Ano / EJA Seg. II','Mundo do trabalho',
     'Comparar as modificações da paisagem na cidade e no campo ao longo do tempo e identificar as relações com os modos de vida humana e com as atividades econômicas.',
     'Analisar','TRUE'],
    ['EF06GE08','Geografia','6º Ano / EJA Seg. II','Formas de representação',
     'Aplicar os conceitos de localização e orientação no uso dos sistemas de representação cartográfica para interpretar e produzir mapas temáticos.',
     'Aplicar','TRUE'],
    ['EF07GE01','Geografia','7º Ano / EJA Seg. II','Território e fronteiras',
     'Avaliar o papel das mobilizações populares, movimentos sociais e das grandes migrações em conflitos territoriais ao redor do mundo.',
     'Avaliar','TRUE'],
    ['EF07GE09','Geografia','7º Ano / EJA Seg. II','Natureza e qualidade de vida',
     'Analisar a influência das condições naturais (clima, relevo, vegetação e solo) na organização dos espaços humanos, em diferentes contextos da realidade brasileira.',
     'Analisar','TRUE'],
    ['EF08GE01','Geografia','8º Ano / EJA Seg. II','Mundo do trabalho',
     'Analisar a produção e os movimentos de populações no território brasileiro, associando-os ao modelo de desenvolvimento econômico e às políticas migratórias.',
     'Analisar','TRUE'],
    ['EF08GE11','Geografia','8º Ano / EJA Seg. II','Natureza e qualidade de vida',
     'Analisar os problemas ambientais locais e globais gerados pelo uso inadequado dos recursos naturais e propor soluções sustentáveis.',
     'Avaliar','TRUE'],
    ['EF09GE01','Geografia','9º Ano / EJA Seg. II','Mundo do trabalho',
     'Analisar criticamente de que forma a hegemonia de diferentes países, blocos e organizações mundiais interfere na qualidade de vida dos cidadãos.',
     'Analisar','TRUE'],
    ['EF09GE12','Geografia','9º Ano / EJA Seg. II','Natureza e qualidade de vida',
     'Analisar as principais características das áreas de risco ambiental no Brasil e propor formas de mitigação e adaptação baseadas em evidências científicas.',
     'Aplicar','TRUE'],

    // ── ARTE ───────────────────────────────────────────────────────
    ['EF69AR01','Arte','EJA Seg. II / 6º-9º Ano','Artes Visuais',
     'Pesquisar, apreciar e analisar formas distintas das artes visuais tradicionais e contemporâneas, em obras de artistas brasileiros e estrangeiros, de diferentes épocas e culturas.',
     'Analisar','TRUE'],
    ['EF69AR16','Arte','EJA Seg. II / 6º-9º Ano','Música',
     'Analisar criticamente, por meio da apreciação musical, usos e funções da música em seus contextos de produção e circulação, relacionando-os com aqueles de seu cotidiano.',
     'Analisar','TRUE'],
    ['EF69AR31','Arte','EJA Seg. II / 6º-9º Ano','Contextos e práticas',
     'Relacionar as práticas artísticas às diferentes dimensões da vida social, cultural, política, histórica, econômica, estética e ética.',
     'Avaliar','TRUE'],

    // ── EDUCAÇÃO FÍSICA ────────────────────────────────────────────
    ['EF69EF03','Educação Física','EJA Seg. II / 6º-9º Ano','Esportes',
     'Diferenciar as práticas corporais, reconhecendo as características que as constituem como categoria cultural e situá-las em seus contextos históricos, sociais e culturais.',
     'Analisar','TRUE'],
    ['EF69EF14','Educação Física','EJA Seg. II / 6º-9º Ano','Lutas',
     'Analisar as lutas presentes no contexto comunitário e regional, reconhecendo sua presença na cultura popular como manifestação expressiva individual e coletiva.',
     'Analisar','TRUE']
  ];
}

// ============================================================
// POPULAR BNCC INICIAL
// ============================================================

/**
 * Popula a planilha MASTER_BNCC com o catálogo inicial de habilidades BNCC.
 * Execute APÓS o SetupInicial (planilha deve existir).
 *
 * Comportamento:
 *  - Soma habilidades NÃO duplicadas (verifica pelo Codigo_BNCC)
 *  - Pula registros já existentes
 *  - Invalida o cache BNCC ao final
 *
 * @returns {{inseridos: number, pulados: number, total: number}}
 */
function popularBNCCInicial() {
  const config = getConfig();
  const sheetId = config.SHEETS.MASTER_BNCC;
  if (!sheetId) {
    throw new Error(
      'Planilha MASTER_BNCC não configurada. Execute o Setup Inicial primeiro.'
    );
  }

  const ss = SpreadsheetApp.openById(sheetId);
  let aba = ss.getSheetByName('Habilidades');
  if (!aba) {
    throw new Error('Aba "Habilidades" não encontrada em MASTER_BNCC.');
  }

  // Coletar códigos já existentes
  const dadosExistentes = aba.getDataRange().getValues();
  const codigosExistentes = new Set(
    dadosExistentes.slice(1).map(r => String(r[0]).trim().toUpperCase())
  );

  const novosDados = _obterDadosBNCC();
  const linhasParaInserir = [];

  novosDados.forEach(linha => {
    const codigo = String(linha[0]).trim().toUpperCase();
    if (!codigosExistentes.has(codigo)) {
      linhasParaInserir.push(linha);
      codigosExistentes.add(codigo); // evitar duplicadas no próprio lote
    }
  });

  const pulados = novosDados.length - linhasParaInserir.length;

  if (linhasParaInserir.length > 0) {
    const ultimaLinha = aba.getLastRow();
    aba.getRange(ultimaLinha + 1, 1, linhasParaInserir.length, 7)
       .setValues(linhasParaInserir);
    registrarLog(
      'INFO',
      `BNCC Seed: ${linhasParaInserir.length} habilidades inseridas, ${pulados} já existiam`,
      `Total no catálogo: ${ultimaLinha - 1 + linhasParaInserir.length}`
    );
  }

  // Invalidar cache para refletir os novos dados
  invalidarCacheBNCC();

  return {
    inseridos: linhasParaInserir.length,
    pulados:   pulados,
    total:     novosDados.length
  };
}

// ============================================================
// DADOS DE TESTE — TURMAS E ALUNOS
// ============================================================

/**
 * Insere turmas e alunos de teste na planilha TURMAS_ALUNOS.
 * Todos os registros são marcados com o prefixo "TESTE_" no ID.
 * Use limparDadosTeste() para remover antes da produção.
 *
 * @returns {{turmas: number, alunos: number}}
 */
function popularTurmasTeste() {
  const config = getConfig();
  const sheetId = config.SHEETS.TURMAS_ALUNOS;
  if (!sheetId) {
    throw new Error(
      'Planilha TURMAS_ALUNOS não configurada. Execute o Setup Inicial primeiro.'
    );
  }

  const ss = SpreadsheetApp.openById(sheetId);
  const abaTurmas     = ss.getSheetByName('Turmas');
  const abaMatriculas = ss.getSheetByName('Matrículas');

  if (!abaTurmas)     throw new Error('Aba "Turmas" não encontrada em TURMAS_ALUNOS.');
  if (!abaMatriculas) throw new Error('Aba "Matrículas" não encontrada em TURMAS_ALUNOS.');

  // ── Turmas de Teste ────────────
  // Colunas: Codigo_Turma, Nome_Turma, Segmento, Turno, Professor_Titular,
  //          Total_Alunos, Ano_Letivo, Ativa
  const turmasTeste = [
    ['7A','7º Ano A','EJA Seg. II','Noturno',Session.getActiveUser().getEmail(),20,'2026','TRUE'],
    ['8A','8º Ano A','EJA Seg. II','Noturno',Session.getActiveUser().getEmail(),18,'2026','TRUE'],
    ['9A','9º Ano A','EJA Seg. II','Noturno',Session.getActiveUser().getEmail(),16,'2026','TRUE']
  ];

  const turmasExistentes = new Set(
    abaTurmas.getDataRange().getValues().slice(1).map(r => String(r[0]).trim())
  );

  const turmasNovas = turmasTeste.filter(t => !turmasExistentes.has(t[0]));
  if (turmasNovas.length > 0) {
    abaTurmas.getRange(
      abaTurmas.getLastRow() + 1, 1, turmasNovas.length, turmasNovas[0].length
    ).setValues(turmasNovas);
  }

  // ── Matrículas de Teste ────────
  // Colunas: ID_Matricula, Nome_Completo, Data_Nascimento, Turma, Turno,
  //          Segmento, Responsavel, Contato_WhatsApp, Email_Responsavel,
  //          Possui_NEE, Tipo_NEE, Laudo_Medico, Requer_PEI,
  //          Observacoes_Pedagogicas, Status,
  //          Faixa_Etaria_EJA, Escolaridade_Anterior_EJA,
  //          Motivacao_Retorno_EJA, Turno_Trabalho_EJA
  const hoje = new Date();
  const matriculasTeste = [
    // 7A — 5 alunos EJA
    ['TESTE_2026_001','Ana Lima Oliveira','01/01/1990','7A','Noturno','EJA Seg. II','Maria Lima','(73) 9 9001-0001','','Não','','Não','Não','','Ativo','26-40','Interrompeu_EF1','Sonho_Pessoal','Tarde'],
    ['TESTE_2026_002','Bruno Santos Costa','15/03/1985','7A','Noturno','EJA Seg. II','José Santos','(73) 9 9001-0002','','Não','','Não','Não','','Ativo','41-60','Interrompeu_EF2','Trabalho','Manhã'],
    ['TESTE_2026_003','Carla Melo Souza','22/07/1998','7A','Noturno','EJA Seg. II','Pedro Melo','(73) 9 9001-0003','','Sim','TDAH','Não','Sim','Necessita de atividades adaptadas em leitura','Ativo','18-25','Interrompeu_EF1','Família','Tarde'],
    ['TESTE_2026_004','Daniel Ferreira Luz','05/11/2005','7A','Noturno','EJA Seg. II','Rita Ferreira','(73) 9 9001-0004','','Não','','Não','Não','','Ativo','15-17','Nunca_Estudou','Exigência_Empregador','Não_Trabalha'],
    ['TESTE_2026_005','Eduarda Rocha Dias','30/06/1995','7A','Noturno','EJA Seg. II','Cláudio Rocha','(73) 9 9001-0005','','Não','','Não','Não','','Ativo','26-40','Interrompeu_EF2','Trabalho','Manhã'],
    // 8A — 4 alunos
    ['TESTE_2026_011','Fábio Alves Nunes','12/02/1988','8A','Noturno','EJA Seg. II','Vera Alves','(73) 9 9001-0011','','Não','','Não','Não','','Ativo','26-40','Interrompeu_EF2','Trabalho','Tarde'],
    ['TESTE_2026_012','Gabriela Sousa Ramos','07/09/1992','8A','Noturno','EJA Seg. II','Luiz Sousa','(73) 9 9001-0012','','Não','','Não','Não','','Ativo','26-40','Interrompeu_EF1','Sonho_Pessoal','Não_Trabalha'],
    ['TESTE_2026_013','Henrique Cruz Borges','14/04/2000','8A','Noturno','EJA Seg. II','Sônia Cruz','(73) 9 9001-0013','','Não','','Não','Não','','Ativo','18-25','Interrompeu_EF2','Trabalho','Manhã'],
    ['TESTE_2026_014','Isabela Moura Pinto','03/12/1980','8A','Noturno','EJA Seg. II','Paulo Moura','(73) 9 9001-0014','','Não','','Não','Não','','Ativo','41-60','Interrompeu_EF1','Família','Tarde'],
    // 9A — 3 alunos
    ['TESTE_2026_021','João Pereira Vaz','25/08/1975','9A','Noturno','EJA Seg. II','Helena Pereira','(73) 9 9001-0021','','Não','','Não','Não','','Ativo','41-60','Interrompeu_EF2','Sonho_Pessoal','Manhã'],
    ['TESTE_2026_022','Kelly Teixeira Soares','18/05/1993','9A','Noturno','EJA Seg. II','Marco Teixeira','(73) 9 9001-0022','','Não','','Não','Não','','Ativo','26-40','Interrompeu_EF2','Exigência_Empregador','Tarde'],
    ['TESTE_2026_023','Leonardo Carvalho Reis','30/11/2004','9A','Noturno','EJA Seg. II','Ana Carvalho','(73) 9 9001-0023','','Sim','DA','Não','Sim','Deficiência auditiva leve. Necessita de apoio visual e escrito.','Ativo','15-17','Nunca_Estudou','Família','Não_Trabalha']
  ];

  const idsExistentes = new Set(
    abaMatriculas.getDataRange().getValues().slice(1).map(r => String(r[0]).trim())
  );

  const matriculasNovas = matriculasTeste.filter(m => !idsExistentes.has(m[0]));
  if (matriculasNovas.length > 0) {
    abaMatriculas.getRange(
      abaMatriculas.getLastRow() + 1, 1, matriculasNovas.length, matriculasNovas[0].length
    ).setValues(matriculasNovas);
  }

  registrarLog('INFO', `Dados de teste inseridos: ${turmasNovas.length} turmas, ${matriculasNovas.length} alunos`);

  return {
    turmas: turmasNovas.length,
    alunos: matriculasNovas.length
  };
}

// ============================================================
// LIMPAR DADOS DE TESTE
// ============================================================

/**
 * Remove todos os registros com prefixo "TESTE_" das abas Turmas e Matrículas.
 * Execute antes de colocar o sistema em produção.
 *
 * @returns {{turmasRemovidas: number, alunosRemovidos: number}}
 */
function limparDadosTeste() {
  const config = getConfig();
  const sheetId = config.SHEETS.TURMAS_ALUNOS;
  if (!sheetId) {
    throw new Error('Planilha TURMAS_ALUNOS não configurada.');
  }

  const ss = SpreadsheetApp.openById(sheetId);

  function removerLinhasTeste(aba) {
    if (!aba) return 0;
    const dados = aba.getDataRange().getValues();
    let removidos = 0;
    // Percorrer de baixo para cima para não deslocar índices
    for (let i = dados.length - 1; i >= 1; i--) {
      if (String(dados[i][0]).startsWith('TESTE_') ||
          String(dados[i][0]).startsWith('7A') ||
          String(dados[i][0]).startsWith('8A') ||
          String(dados[i][0]).startsWith('9A')) {
        aba.deleteRow(i + 1);
        removidos++;
      }
    }
    return removidos;
  }

  // Para Turmas, identificar pelos códigos de teste
  const abaTurmas = ss.getSheetByName('Turmas');
  let turmasRemovidas = 0;
  if (abaTurmas) {
    const dados = abaTurmas.getDataRange().getValues();
    for (let i = dados.length - 1; i >= 1; i--) {
      if (['7A', '8A', '9A'].includes(String(dados[i][0]).trim())) {
        abaTurmas.deleteRow(i + 1);
        turmasRemovidas++;
      }
    }
  }

  const abaMatriculas = ss.getSheetByName('Matrículas');
  let alunosRemovidos = 0;
  if (abaMatriculas) {
    const dados = abaMatriculas.getDataRange().getValues();
    for (let i = dados.length - 1; i >= 1; i--) {
      if (String(dados[i][0]).startsWith('TESTE_')) {
        abaMatriculas.deleteRow(i + 1);
        alunosRemovidos++;
      }
    }
  }

  registrarLog('AUDITORIA', `Dados de teste removidos: ${turmasRemovidas} turmas, ${alunosRemovidos} alunos`);

  return { turmasRemovidas, alunosRemovidos };
}
