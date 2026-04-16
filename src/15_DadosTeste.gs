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
     'Analisar','TRUE'],

    // ── MATEMÁTICA — habilidades complementares ────────────────────
    ['EF06MA02','Matemática','6º Ano / EJA Seg. II','Números',
     'Classificar números naturais em primos e compostos, reconhecendo a importância dos números primos.',
     'Compreender','TRUE'],
    ['EF06MA04','Matemática','6º Ano / EJA Seg. II','Números',
     'Elaborar e resolver problemas com números naturais, utilizando divisores e múltiplos.',
     'Aplicar','TRUE'],
    ['EF06MA05','Matemática','6º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas com números racionais positivos na forma decimal, com e sem uso de calculadora.',
     'Aplicar','TRUE'],
    ['EF06MA06','Matemática','6º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas que envolvam cálculo da percentagem de quantidades, com e sem uso de tecnologias.',
     'Aplicar','TRUE'],
    ['EF06MA08','Matemática','6º Ano / EJA Seg. II','Números',
     'Reconhecer frações equivalentes e representar a fração equivalente de um número racional na forma decimal.',
     'Compreender','TRUE'],
    ['EF06MA09','Matemática','6º Ano / EJA Seg. II','Álgebra',
     'Resolver e elaborar problemas, com e sem uso de tecnologias, que envolvam razão e proporção com sequências numéricas.',
     'Aplicar','TRUE'],
    ['EF06MA10','Matemática','6º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas envolvendo porcentagem de 10%, 25%, 50% e 100%, ligados ao cotidiano.',
     'Aplicar','TRUE'],
    ['EF06MA11','Matemática','6º Ano / EJA Seg. II','Números',
     'Localizar números inteiros e racionais na reta numérica e comparar sua ordem de grandeza.',
     'Compreender','TRUE'],
    ['EF06MA13','Matemática','6º Ano / EJA Seg. II','Números',
     'Identificar as diferentes representações de um número racional e transitar entre elas.',
     'Compreender','TRUE'],
    ['EF06MA16','Matemática','6º Ano / EJA Seg. II','Geometria',
     'Determinar a área de figuras desenhadas em malhas quadriculadas, por composição e decomposição.',
     'Aplicar','TRUE'],
    ['EF06MA18','Matemática','6º Ano / EJA Seg. II','Geometria',
     'Resolver e elaborar problemas que envolvam perímetro e área de quadriláteros.',
     'Aplicar','TRUE'],
    ['EF06MA21','Matemática','6º Ano / EJA Seg. II','Números',
     'Calcular o mínimo múltiplo comum e o máximo divisor comum de dois ou mais números naturais.',
     'Aplicar','TRUE'],
    ['EF06MA22','Matemática','6º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas com potenciação e radiciação de números naturais.',
     'Aplicar','TRUE'],
    ['EF06MA23','Matemática','6º Ano / EJA Seg. II','Geometria',
     'Diferenciar polígonos de não polígonos, classificando-os quanto ao número de vértices, lados e ângulos.',
     'Compreender','TRUE'],
    ['EF07MA02','Matemática','7º Ano / EJA Seg. II','Números',
     'Converter frações em representação decimal e vice-versa, identificando decimais finitos e periódicos.',
     'Compreender','TRUE'],
    ['EF07MA03','Matemática','7º Ano / EJA Seg. II','Números',
     'Calcular porcentagens por estimativas e por estratégias variadas, com e sem calculadora.',
     'Aplicar','TRUE'],
    ['EF07MA04','Matemática','7º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas com números racionais, envolvendo adição, subtração, multiplicação e divisão.',
     'Aplicar','TRUE'],
    ['EF07MA05','Matemática','7º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas com variação de proporcionalidade direta e inversa entre grandezas.',
     'Aplicar','TRUE'],
    ['EF07MA06','Matemática','7º Ano / EJA Seg. II','Geometria',
     'Reconhecer pares de ângulos opostos pelo vértice e ângulos formados por retas paralelas cortadas por transversal.',
     'Compreender','TRUE'],
    ['EF07MA08','Matemática','7º Ano / EJA Seg. II','Álgebra',
     'Resolver e elaborar problemas representados por equações polinomiais de 1º grau.',
     'Aplicar','TRUE'],
    ['EF07MA14','Matemática','7º Ano / EJA Seg. II','Geometria',
     'Classificar triângulos quanto aos ângulos e aos lados e verificar congruência de figuras planas.',
     'Compreender','TRUE'],
    ['EF07MA15','Matemática','7º Ano / EJA Seg. II','Geometria',
     'Reconhecer a soma dos ângulos internos de um triângulo como 180° e de um quadrilátero como 360°.',
     'Compreender','TRUE'],
    ['EF07MA20','Matemática','7º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Resolver problemas que envolvam o cálculo da média aritmética, da moda e da mediana de um conjunto de dados.',
     'Aplicar','TRUE'],
    ['EF07MA21','Matemática','7º Ano / EJA Seg. II','Geometria',
     'Calcular a área de triângulos e quadriláteros, utilizando as fórmulas pertinentes.',
     'Aplicar','TRUE'],
    ['EF07MA23','Matemática','7º Ano / EJA Seg. II','Geometria',
     'Determinar o comprimento de circunferência e a área do círculo, com e sem uso de tecnologias.',
     'Aplicar','TRUE'],
    ['EF07MA24','Matemática','7º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Realizar experimentos aleatórios, registrar resultados e calcular probabilidades simples.',
     'Aplicar','TRUE'],
    ['EF08MA02','Matemática','8º Ano / EJA Seg. II','Números',
     'Resolver e elaborar problemas com números reais em contextos do cotidiano e da ciência.',
     'Aplicar','TRUE'],
    ['EF08MA03','Matemática','8º Ano / EJA Seg. II','Números',
     'Compreender e aplicar propriedades das potências com expoentes negativos e racionais.',
     'Compreender','TRUE'],
    ['EF08MA07','Matemática','8º Ano / EJA Seg. II','Álgebra',
     'Resolver e elaborar problemas que envolvam sistemas de equações polinomiais de 1º grau.',
     'Aplicar','TRUE'],
    ['EF08MA09','Matemática','8º Ano / EJA Seg. II','Geometria',
     'Reconhecer, nomear e comparar polígonos regulares, relacionando com suas propriedades de lados e ângulos.',
     'Compreender','TRUE'],
    ['EF08MA11','Matemática','8º Ano / EJA Seg. II','Geometria',
     'Resolver e elaborar problemas utilizando a proporcionalidade entre triângulos semelhantes.',
     'Aplicar','TRUE'],
    ['EF08MA14','Matemática','8º Ano / EJA Seg. II','Geometria',
     'Reconhecer e utilizar as propriedades dos quadriláteros para resolver problemas geométricos.',
     'Aplicar','TRUE'],
    ['EF08MA15','Matemática','8º Ano / EJA Seg. II','Geometria',
     'Calcular a área de figuras planas, incluindo triângulos, paralelogramos e trapézios.',
     'Aplicar','TRUE'],
    ['EF08MA16','Matemática','8º Ano / EJA Seg. II','Geometria',
     'Determinar o volume de prismas e cilindros retos usando fórmulas e resolver problemas.',
     'Aplicar','TRUE'],
    ['EF08MA20','Matemática','8º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Interpretar e construir tabelas e gráficos de barras, de setores e de linhas para representar dados.',
     'Aplicar','TRUE'],
    ['EF08MA22','Matemática','8º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Calcular medidas de tendência central (média, moda e mediana) de um conjunto de dados.',
     'Aplicar','TRUE'],
    ['EF08MA24','Matemática','8º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Calcular a probabilidade de eventos em experimentos aleatórios de espaço amostral finito.',
     'Aplicar','TRUE'],
    ['EF09MA02','Matemática','9º Ano / EJA Seg. II','Números',
     'Reconhecer o número irracional como número real e representá-lo na reta numérica.',
     'Compreender','TRUE'],
    ['EF09MA03','Matemática','9º Ano / EJA Seg. II','Números',
     'Aplicar as propriedades das potências com expoentes racionais e resolver problemas.',
     'Aplicar','TRUE'],
    ['EF09MA05','Matemática','9º Ano / EJA Seg. II','Álgebra',
     'Identificar e descrever padrões e regularidades em sequências numéricas e funções.',
     'Compreender','TRUE'],
    ['EF09MA07','Matemática','9º Ano / EJA Seg. II','Álgebra',
     'Resolver e elaborar problemas representados por sistemas de equações polinomiais de 1º grau.',
     'Aplicar','TRUE'],
    ['EF09MA09','Matemática','9º Ano / EJA Seg. II','Geometria',
     'Reconhecer e aplicar o Teorema de Tales para dividir segmentos em partes proporcionais.',
     'Aplicar','TRUE'],
    ['EF09MA10','Matemática','9º Ano / EJA Seg. II','Geometria',
     'Calcular área lateral, área total e volume de prismas, pirâmides e cilindros.',
     'Aplicar','TRUE'],
    ['EF09MA12','Matemática','9º Ano / EJA Seg. II','Geometria',
     'Resolver e elaborar problemas que envolvam as razões trigonométricas seno, cosseno e tangente no triângulo retângulo.',
     'Aplicar','TRUE'],
    ['EF09MA16','Matemática','9º Ano / EJA Seg. II','Probabilidade e Estatística',
     'Resolver problemas envolvendo probabilidades de eventos complementares e mutuamente exclusivos.',
     'Aplicar','TRUE'],

    // ── CIÊNCIAS — habilidades complementares ─────────────────────
    ['EF06CI02','Ciências','6º Ano / EJA Seg. II','Matéria e Energia',
     'Analisar e classificar como homogêneas ou heterogêneas misturas presentes em processos do cotidiano.',
     'Analisar','TRUE'],
    ['EF06CI03','Ciências','6º Ano / EJA Seg. II','Matéria e Energia',
     'Selecionar métodos mais adequados para a separação de componentes de misturas, com base em suas propriedades.',
     'Aplicar','TRUE'],
    ['EF06CI06','Ciências','6º Ano / EJA Seg. II','Vida e Evolução',
     'Descrever e representar o modelo celular básico, identificando diferenças entre células animais e vegetais.',
     'Compreender','TRUE'],
    ['EF06CI09','Ciências','6º Ano / EJA Seg. II','Terra e Universo',
     'Descrever a composição e a importância do solo para a manutenção da vida, propondo ações de conservação.',
     'Compreender','TRUE'],
    ['EF06CI12','Ciências','6º Ano / EJA Seg. II','Terra e Universo',
     'Identificar os diferentes tipos de rocha, associando-os aos processos geológicos que os formaram.',
     'Compreender','TRUE'],
    ['EF07CI04','Ciências','7º Ano / EJA Seg. II','Vida e Evolução',
     'Analisar e explicar as transformações que ocorrem no corpo dos adolescentes (puberdade), diferenciando sexo biológico e gênero.',
     'Compreender','TRUE'],
    ['EF07CI06','Ciências','7º Ano / EJA Seg. II','Vida e Evolução',
     'Explicar a dinâmica de um ecossistema, inter-relacionando os diferentes componentes bióticos e abióticos.',
     'Compreender','TRUE'],
    ['EF07CI08','Ciências','7º Ano / EJA Seg. II','Vida e Evolução',
     'Analisar a importância da biodiversidade para a sustentabilidade do planeta, considerando ecossistemas brasileiros.',
     'Analisar','TRUE'],
    ['EF08CI03','Ciências','8º Ano / EJA Seg. II','Matéria e Energia',
     'Classificar materiais como condutores ou isolantes elétricos e térmicos, associando suas propriedades a usos cotidianos.',
     'Analisar','TRUE'],
    ['EF08CI04','Ciências','8º Ano / EJA Seg. II','Matéria e Energia',
     'Calcular e interpretar o consumo de energia elétrica de dispositivos a partir de suas especificações técnicas.',
     'Aplicar','TRUE'],
    ['EF08CI07','Ciências','8º Ano / EJA Seg. II','Vida e Evolução',
     'Analisar as formas de transmissão de doenças infecciosas e infecções sexualmente transmissíveis, avaliando medidas preventivas.',
     'Avaliar','TRUE'],
    ['EF09CI06','Ciências','9º Ano / EJA Seg. II','Terra e Universo',
     'Explicar a composição e as características das camadas do planeta Terra, do Sistema Solar e do Universo.',
     'Compreender','TRUE'],
    ['EF09CI08','Ciências','9º Ano / EJA Seg. II','Vida e Evolução',
     'Analisar e comparar diferentes modelos explicativos sobre a origem da vida na Terra.',
     'Analisar','TRUE'],
    ['EF09CI09','Ciências','9º Ano / EJA Seg. II','Vida e Evolução',
     'Discutir a evolução e a diversidade das espécies com base no conceito de adaptação e seleção natural.',
     'Analisar','TRUE'],

    // ── HISTÓRIA — habilidades complementares ─────────────────────
    ['EF06HI02','História','6º Ano / EJA Seg. II','Mundo antigo',
     'Explicar as formas de organização dos estados gregos antigos, destacando a democracia ateniense e sua influência.',
     'Compreender','TRUE'],
    ['EF06HI03','História','6º Ano / EJA Seg. II','Mundo antigo',
     'Descrever e comparar aspectos da vida social, cultural e econômica do Egito antigo.',
     'Compreender','TRUE'],
    ['EF06HI07','História','6º Ano / EJA Seg. II','Mundo antigo',
     'Analisar aspectos representativos da história e da cultura das populações indígenas originárias do Brasil e da América.',
     'Analisar','TRUE'],
    ['EF06HI09','História','6º Ano / EJA Seg. II','Mundo antigo',
     'Identificar e descrever formas de organização política, social e econômica da Europa feudal.',
     'Compreender','TRUE'],
    ['EF07HI02','História','7º Ano / EJA Seg. II','Modernidade',
     'Identificar mecanismos e as dinâmicas do tráfico negreiro e da escravidão no Brasil e na América.',
     'Analisar','TRUE'],
    ['EF07HI03','História','7º Ano / EJA Seg. II','Modernidade',
     'Analisar os mecanismos de exploração e os impactos da colonização europeia na América do Sul.',
     'Analisar','TRUE'],
    ['EF07HI06','História','7º Ano / EJA Seg. II','Modernidade',
     'Identificar a influência das culturas africanas na formação da sociedade e da cultura brasileira.',
     'Analisar','TRUE'],
    ['EF08HI02','História','8º Ano / EJA Seg. II','Modernidade',
     'Identificar as transformações econômicas, sociais e tecnológicas promovidas pela Revolução Industrial.',
     'Compreender','TRUE'],
    ['EF08HI03','História','8º Ano / EJA Seg. II','Independências',
     'Comparar as Revoluções Americana e Francesa, identificando causas, ideais iluministas e consequências.',
     'Analisar','TRUE'],
    ['EF08HI06','História','8º Ano / EJA Seg. II','Independências',
     'Analisar o processo de independência do Brasil, os conflitos que o caracterizaram e a formação do Estado nacional.',
     'Analisar','TRUE'],
    ['EF09HI02','História','9º Ano / EJA Seg. II','Século XX',
     'Analisar as transformações políticas e sociais decorrentes do processo de industrialização no Brasil.',
     'Analisar','TRUE'],
    ['EF09HI04','História','9º Ano / EJA Seg. II','Século XX',
     'Descrever e analisar as fases do governo Vargas (1930–1954) e sua influência na industrialização e na legislação trabalhista.',
     'Analisar','TRUE'],
    ['EF09HI05','História','9º Ano / EJA Seg. II','Século XX',
     'Analisar as características do fascismo e do nazismo como regimes totalitários e sua relação com a Segunda Guerra Mundial.',
     'Analisar','TRUE'],

    // ── GEOGRAFIA — habilidades complementares ────────────────────
    ['EF06GE03','Geografia','6º Ano / EJA Seg. II','Natureza e qualidade de vida',
     'Descrever os movimentos do planeta Terra e sua relação com as zonas climáticas e as estações do ano.',
     'Compreender','TRUE'],
    ['EF06GE04','Geografia','6º Ano / EJA Seg. II','Natureza e qualidade de vida',
     'Descrever o ciclo da água, comparando o seu uso pelo ser humano em diferentes contextos geográficos.',
     'Compreender','TRUE'],
    ['EF06GE05','Geografia','6º Ano / EJA Seg. II','Natureza e qualidade de vida',
     'Analisar a importância dos oceanos e das bacias hidrográficas para a vida humana e para os ecossistemas.',
     'Analisar','TRUE'],
    ['EF06GE09','Geografia','6º Ano / EJA Seg. II','Formas de representação',
     'Interpretar escalas cartográficas, projeções e sistemas de referência geográfica.',
     'Aplicar','TRUE'],
    ['EF07GE02','Geografia','7º Ano / EJA Seg. II','Território e fronteiras',
     'Analisar processos de formação de fronteiras e a influência de organismos internacionais nas relações geopolíticas.',
     'Analisar','TRUE'],
    ['EF07GE04','Geografia','7º Ano / EJA Seg. II','Natureza e qualidade de vida',
     'Analisar as interações entre sociedade e natureza nos diferentes biomas mundiais, destacando impactos ambientais.',
     'Analisar','TRUE'],
    ['EF07GE06','Geografia','7º Ano / EJA Seg. II','Mundo do trabalho',
     'Identificar e comparar a produção e a importância das atividades agrícolas no Brasil e no mundo.',
     'Analisar','TRUE'],
    ['EF07GE08','Geografia','7º Ano / EJA Seg. II','Cidades e urbanização',
     'Comparar o processo de urbanização brasileiro com o de outros países, identificando causas e consequências.',
     'Analisar','TRUE'],
    ['EF08GE02','Geografia','8º Ano / EJA Seg. II','Território e fronteiras',
     'Analisar a distribuição territorial da população brasileira, considerando aspectos históricos e socioeconômicos.',
     'Analisar','TRUE'],
    ['EF08GE04','Geografia','8º Ano / EJA Seg. II','Mundo do trabalho',
     'Diferenciar e analisar os componentes do espaço agrário brasileiro, relacionando-os ao contexto econômico.',
     'Analisar','TRUE'],
    ['EF08GE07','Geografia','8º Ano / EJA Seg. II','Cidades e urbanização',
     'Analisar os efeitos das migrações internas nas cidades brasileiras, incluindo aspectos sociais e culturais.',
     'Analisar','TRUE'],
    ['EF08GE10','Geografia','8º Ano / EJA Seg. II','Natureza e qualidade de vida',
     'Analisar aspectos representativos da geodiversidade brasileira e sua relação com os biomas.',
     'Analisar','TRUE'],
    ['EF09GE03','Geografia','9º Ano / EJA Seg. II','Território e fronteiras',
     'Identificar e comparar diferentes sistemas políticos e econômicos no mundo contemporâneo.',
     'Analisar','TRUE'],
    ['EF09GE06','Geografia','9º Ano / EJA Seg. II','Natureza e qualidade de vida',
     'Analisar a relação entre padrões de produção, consumo e seus impactos ambientais.',
     'Avaliar','TRUE'],

    // ── ARTE — habilidades complementares (EF69AR) ────────────────
    ['EF69AR02','Arte','EJA Seg. II / 6º-9º Ano','Artes Visuais',
     'Pesquisar e analisar diferentes formas de expressão, gêneros, estilos e períodos das artes visuais.',
     'Analisar','TRUE'],
    ['EF69AR05','Arte','EJA Seg. II / 6º-9º Ano','Artes Visuais',
     'Construir propostas artísticas colaborativas e coletivas em artes visuais, explorando espaços e materiais.',
     'Criar','TRUE'],
    ['EF69AR06','Arte','EJA Seg. II / 6º-9º Ano','Artes Visuais',
     'Desenvolver processos de criação em artes visuais com base em estudos e pesquisas sobre formas da natureza e obras de artistas.',
     'Criar','TRUE'],
    ['EF69AR10','Arte','EJA Seg. II / 6º-9º Ano','Artes Visuais',
     'Analisar os elementos constitutivos das artes visuais nas suas relações composicionais (ponto, linha, plano, cor, textura).',
     'Analisar','TRUE'],
    ['EF69AR11','Arte','EJA Seg. II / 6º-9º Ano','Dança',
     'Experimentar e analisar as possibilidades expressivas e comunicativas de gestos e movimentos corporais na dança.',
     'Analisar','TRUE'],
    ['EF69AR12','Arte','EJA Seg. II / 6º-9º Ano','Dança',
     'Investigar e experimentar procedimentos de improvisação e criação do movimento na dança.',
     'Criar','TRUE'],
    ['EF69AR17','Arte','EJA Seg. II / 6º-9º Ano','Música',
     'Explorar e analisar criticamente elementos constitutivos da música: som, silêncio, ritmo, melodia e harmonia.',
     'Analisar','TRUE'],
    ['EF69AR20','Arte','EJA Seg. II / 6º-9º Ano','Música',
     'Explorar e analisar formas de registro de ideias musicais com grafias convencionais e não convencionais.',
     'Analisar','TRUE'],
    ['EF69AR25','Arte','EJA Seg. II / 6º-9º Ano','Teatro',
     'Criar improvisações e experimentos teatrais, explorando expressão corporal, vocal e uso do espaço.',
     'Criar','TRUE'],
    ['EF69AR29','Arte','EJA Seg. II / 6º-9º Ano','Contextos e práticas',
     'Analisar aspectos históricos, sociais e políticos da produção artística de diferentes períodos e culturas.',
     'Analisar','TRUE'],
    ['EF69AR30','Arte','EJA Seg. II / 6º-9º Ano','Contextos e práticas',
     'Analisar e valorizar o patrimônio cultural material e imaterial de culturas diversas, incluindo culturas brasileiras.',
     'Avaliar','TRUE'],
    ['EF69AR32','Arte','EJA Seg. II / 6º-9º Ano','Contextos e práticas',
     'Analisar as transformações históricas dos valores e das técnicas empregados nas diversas produções artísticas.',
     'Analisar','TRUE'],
    ['EF69AR35','Arte','EJA Seg. II / 6º-9º Ano','Contextos e práticas',
     'Identificar e utilizar diferentes tecnologias e recursos digitais para acessar, apreciar, produzir e divulgar práticas artísticas.',
     'Aplicar','TRUE'],
    ['EF69AR36','Arte','EJA Seg. II / 6º-9º Ano','Contextos e práticas',
     'Desenvolver autonomia, crítica, autoria e trabalho coletivo nas artes, construindo formas de expressão próprias.',
     'Criar','TRUE'],

    // ── EDUCAÇÃO FÍSICA — habilidades complementares (EF69EF) ──────
    ['EF69EF01','Educação Física','EJA Seg. II / 6º-9º Ano','Brincadeiras e jogos',
     'Experimentar, fruir e recriar diferentes brincadeiras e jogos do Brasil e do mundo, incluindo os de matriz indígena e africana.',
     'Aplicar','TRUE'],
    ['EF69EF02','Educação Física','EJA Seg. II / 6º-9º Ano','Brincadeiras e jogos',
     'Compreender as transformações históricas das brincadeiras e dos jogos, discutindo sua importância cultural.',
     'Compreender','TRUE'],
    ['EF69EF04','Educação Física','EJA Seg. II / 6º-9º Ano','Brincadeiras e jogos',
     'Recriar e organizar jogos e brincadeiras de matriz africana e indígena, valorizando essa herança cultural.',
     'Criar','TRUE'],
    ['EF69EF05','Educação Física','EJA Seg. II / 6º-9º Ano','Esportes',
     'Experimentar e fruir esportes de marca, precisão e técnico-combinatórios, compreendendo suas características.',
     'Aplicar','TRUE'],
    ['EF69EF06','Educação Física','EJA Seg. II / 6º-9º Ano','Esportes',
     'Identificar fins dos esportes de rendimento e de participação, discutindo diferenças e valores associados.',
     'Analisar','TRUE'],
    ['EF69EF07','Educação Física','EJA Seg. II / 6º-9º Ano','Esportes',
     'Analisar e discutir estereótipos e preconceitos nos esportes, propondo formas de combater a discriminação.',
     'Avaliar','TRUE'],
    ['EF69EF08','Educação Física','EJA Seg. II / 6º-9º Ano','Esportes',
     'Executar fundamentos técnico-táticos dos esportes de invasão, cooperando com o grupo.',
     'Aplicar','TRUE'],
    ['EF69EF09','Educação Física','EJA Seg. II / 6º-9º Ano','Esportes',
     'Praticar fundamentos técnico-táticos dos esportes de rede e parede, aplicando regras básicas.',
     'Aplicar','TRUE'],
    ['EF69EF10','Educação Física','EJA Seg. II / 6º-9º Ano','Lutas',
     'Diferenciar as lutas do campo artístico-cênico das práticas de autodefesa, reconhecendo valores culturais.',
     'Compreender','TRUE'],
    ['EF69EF11','Educação Física','EJA Seg. II / 6º-9º Ano','Práticas corporais de aventura',
     'Experimentar e fruir diferentes práticas corporais de aventura na natureza, identificando riscos e cuidados.',
     'Aplicar','TRUE'],
    ['EF69EF12','Educação Física','EJA Seg. II / 6º-9º Ano','Práticas corporais de aventura',
     'Identificar riscos e adotar medidas de segurança nas práticas de aventura na natureza e no ambiente urbano.',
     'Aplicar','TRUE'],
    ['EF69EF13','Educação Física','EJA Seg. II / 6º-9º Ano','Práticas corporais de aventura',
     'Experimentar e fruir práticas corporais de aventura urbana, reconhecendo a importância da segurança.',
     'Aplicar','TRUE'],
    ['EF69EF15','Educação Física','EJA Seg. II / 6º-9º Ano','Ginástica',
     'Discutir as relações entre atividade física, saúde e qualidade de vida, associando exercício à prevenção de doenças.',
     'Avaliar','TRUE'],

    // ── LÍNGUA INGLESA — EF Anos Finais (EF69LI) ──────────────────
    ['EF69LI01','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Leitura',
     'Identificar o assunto de textos em língua inglesa lidos em sala de aula, com suporte de recursos visuais e contextuais.',
     'Compreender','TRUE'],
    ['EF69LI02','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Leitura',
     'Compreender o significado de palavras e expressões do cotidiano em língua inglesa, ampliando o vocabulário receptivo.',
     'Compreender','TRUE'],
    ['EF69LI03','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Leitura',
     'Compreender relações de adição, causa/consequência, oposição e conclusão em diferentes textos em inglês.',
     'Compreender','TRUE'],
    ['EF69LI04','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Oralidade',
     'Reconhecer expressões corporais e paralinguísticas de falantes de língua inglesa em diferentes situações comunicativas.',
     'Compreender','TRUE'],
    ['EF69LI05','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Oralidade',
     'Utilizar vocabulário de uso cotidiano em língua inglesa nas interações orais em sala de aula.',
     'Aplicar','TRUE'],
    ['EF69LI06','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Escrita',
     'Utilizar elementos coesivos para dar continuidade a textos escritos produzidos em inglês.',
     'Aplicar','TRUE'],
    ['EF69LI07','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Escrita',
     'Utilizar, com mediação do professor, ferramentas digitais de busca para pesquisas em língua inglesa.',
     'Aplicar','TRUE'],
    ['EF69LI08','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Dimensão intercultural',
     'Reconhecer a importância da língua inglesa como língua de comunicação global e sua influência na cultura.',
     'Compreender','TRUE'],
    ['EF69LI09','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Escrita',
     'Produzir textos em inglês relacionados ao cotidiano com base em modelos, considerando a situação comunicativa.',
     'Criar','TRUE'],
    ['EF69LI10','Língua Inglesa','EJA Seg. II / 6º-9º Ano','Dimensão intercultural',
     'Valorizar o plurilinguismo como fenômeno natural das línguas e culturas do mundo.',
     'Valorizar','TRUE'],

    // ── ENSINO RELIGIOSO — EF Anos Finais (EF69ER) ────────────────
    ['EF69ER01','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Crenças religiosas e filosofias de vida',
     'Conhecer e compreender os elementos básicos que compõem as diferentes religiões e filosofias de vida.',
     'Compreender','TRUE'],
    ['EF69ER02','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Crenças religiosas e filosofias de vida',
     'Reconhecer o significado de mitos, lendas e narrativas das diferentes tradições religiosas e sua importância cultural.',
     'Compreender','TRUE'],
    ['EF69ER03','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Textos sagrados',
     'Identificar os lugares sagrados e os textos sagrados das diferentes tradições religiosas.',
     'Compreender','TRUE'],
    ['EF69ER04','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Crenças religiosas e filosofias de vida',
     'Analisar a contribuição das tradições religiosas para a construção de virtudes e valores humanos como respeito e solidariedade.',
     'Analisar','TRUE'],
    ['EF69ER05','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Crenças religiosas e filosofias de vida',
     'Reconhecer a presença do sagrado em práticas cotidianas e comunitárias de diferentes tradições.',
     'Compreender','TRUE'],
    ['EF69ER06','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Crenças religiosas e filosofias de vida',
     'Investigar a presença do sagrado na natureza e nos diferentes ciclos da vida em diversas tradições.',
     'Analisar','TRUE'],
    ['EF69ER07','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Ritos e rituais',
     'Reconhecer práticas rituais de diferentes tradições religiosas e filosofias de vida, respeitando a diversidade.',
     'Compreender','TRUE'],
    ['EF69ER08','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Ritos e rituais',
     'Analisar as representações artísticas das diferentes tradições religiosas como expressões simbólicas.',
     'Analisar','TRUE'],
    ['EF69ER09','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Identidade e alteridade',
     'Debater, sem discriminação, as tradições e organizações religiosas e filosofias de vida, valorizando o diálogo.',
     'Avaliar','TRUE'],
    ['EF69ER10','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Identidade e alteridade',
     'Analisar os direitos de liberdade de crença e de religião no Brasil, compreendendo o Estado laico.',
     'Analisar','TRUE'],
    ['EF69ER11','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Identidade e alteridade',
     'Identificar e respeitar a diversidade de práticas e de posições sobre crenças, sem proselitismo.',
     'Avaliar','TRUE'],
    ['EF69ER12','Ensino Religioso','EJA Seg. II / 6º-9º Ano','Identidade e alteridade',
     'Analisar as relações entre as diferentes tradições religiosas e os Direitos Humanos, reconhecendo a dignidade humana.',
     'Avaliar','TRUE']
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
