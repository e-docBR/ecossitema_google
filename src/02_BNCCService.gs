/**
 * PEDAGOGO.AI — Serviço de Habilidades BNCC
 * Arquivo: 02_BNCCService.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Gateway único para consulta ao catálogo MASTER_BNCC.
 * REGRA INVIOLÁVEL: Nunca embutir código BNCC em prompt do Gemini
 * sem antes chamar validarHabilidadeExiste().
 *
 * Sprint 2 — CRÍTICO-02: Cache persistido via CacheService (6h TTL)
 * Sprint 4 — Novas funções: busca por texto, progressão vertical,
 *             equivalentes EJA, competências gerais, uso de habilidade.
 */

// ============================================================
// NOMES DAS ABAS NA PLANILHA MASTER_BNCC
// ============================================================

const ABAS_BNCC = Object.freeze({
  HABILIDADES:        'Habilidades',
  DESCRITORES:        'Descritores_SAEB',
  COMPETENCIAS:       'Competencias_Gerais',
  MAPEAMENTO_EJA:     'Mapeamento_EJA',
  PROGRESSAO:         'Progressao_Vertical'
});

// Índices das colunas na aba Habilidades (Schema v2 — Sprint 4)
const COL_BNCC = Object.freeze({
  CODIGO:              0,   // EF06LP05
  PREFIXO:             1,   // EF / EI / EM / CM
  COMPONENTE:          2,   // Língua Portuguesa
  AREA_CONHECIMENTO:   3,   // Linguagens
  ANO_SERIE:           4,   // 6º Ano
  ANO_NUMERO:          5,   // 6
  CAMPO_TEMATICO:      6,
  UNIDADE_TEMATICA:    7,
  OBJETO_CONHECIMENTO: 8,
  DESCRICAO:           9,
  NIVEL_BLOOM:         10,
  NIVEL_BLOOM_NUM:     11,
  COMPETENCIAS_GERAIS: 12,  // "1;3;7"
  DESCRITORES_SAEB:    13,  // "D1;D15"
  HAB_EJA_EQUIV:       14,
  PALAVRAS_CHAVE:      15,
  TOTAL_USO:           16,
  ATIVO:               17,
  OBSERVACOES:         18
});

// Schema v1 legado (7 colunas) — detectado automaticamente na carga
const COL_BNCC_V1 = Object.freeze({
  CODIGO: 0, COMPONENTE: 1, ANO_SERIE: 2, CAMPO_TEMATICO: 3,
  DESCRICAO: 4, NIVEL_BLOOM: 5, ATIVO: 6
});

// ============================================================
// CACHE DE HABILIDADES (Sprint 2 — CRÍTICO-02)
// ============================================================

/** Cache em memória para a execução atual */
let _cacheBNCC = null;

const BNCC_CACHE_PREFIX = 'BNCC_V2_';
const BNCC_CACHE_META   = 'BNCC_V2_META';
const BNCC_CACHE_TTL    = 21600;  // 6 horas
const BNCC_CHUNK_SIZE   = 60;     // habilidades por chunk (stay under 100KB limit)

/**
 * Carrega ou retorna o cache das habilidades BNCC.
 * Hierarquia: memória → CacheService → Planilha.
 * @returns {Object} Mapa codigo → dados da habilidade
 */
function _obterCacheBNCC() {
  // 1. Memória (mais rápido — mesmo request)
  if (_cacheBNCC) return _cacheBNCC;

  // 2. CacheService (entre execuções)
  try {
    const cache = CacheService.getScriptCache();
    const metaStr = cache.get(BNCC_CACHE_META);
    if (metaStr) {
      const meta = JSON.parse(metaStr);
      const resultado = {};
      let completo = true;

      for (let i = 0; i < meta.totalChunks; i++) {
        const chunkStr = cache.get(BNCC_CACHE_PREFIX + i);
        if (!chunkStr) { completo = false; break; }
        JSON.parse(chunkStr).forEach(h => { resultado[h.codigo] = h; });
      }

      if (completo) {
        _cacheBNCC = resultado;
        registrarLog('INFO', `Cache BNCC carregado do CacheService: ${Object.keys(resultado).length} habilidades`);
        return _cacheBNCC;
      }
    }
  } catch (_) { /* CacheService indisponível — continua para planilha */ }

  // 3. Planilha (fonte de verdade)
  return _carregarBNCCDaPlanilha();
}

/**
 * Carrega habilidades da planilha MASTER_BNCC e popula o cache.
 * @private
 */
function _carregarBNCCDaPlanilha() {
  const config = getConfig();
  const sheetId = config.SHEETS.MASTER_BNCC;
  if (!sheetId) {
    throw new Error(
      'Planilha MASTER_BNCC não configurada. ' +
      'Execute SetupInicial.executarSetupCompleto() primeiro.'
    );
  }

  const dados = lerAba(sheetId, ABAS_BNCC.HABILIDADES);
  _cacheBNCC = {};

  // Detectar schema v1 (7 colunas) vs v2 (19 colunas)
  const totalColunas = dados[0] ? dados[0].length : 0;
  const isV1 = totalColunas <= 8;

  dados.slice(1).forEach(linha => {
    const codigo = String(linha[COL_BNCC_V1.CODIGO] || '').trim().toUpperCase();
    const ativo  = isV1
      ? String(linha[COL_BNCC_V1.ATIVO]).toUpperCase() !== 'FALSE'
      : estaAtivo(linha[COL_BNCC.ATIVO]);

    if (!codigo || !ativo) return;

    if (isV1) {
      // Compatibilidade com schema legado
      _cacheBNCC[codigo] = {
        codigo,
        prefixo:             segmentoBNCC(codigo) || 'EF',
        componente:          String(linha[COL_BNCC_V1.COMPONENTE]     || ''),
        areaConhecimento:    '',
        anoSerie:            String(linha[COL_BNCC_V1.ANO_SERIE]      || ''),
        anoNumero:           0,
        campoTematico:       String(linha[COL_BNCC_V1.CAMPO_TEMATICO] || ''),
        unidadeTematica:     '',
        objetoConhecimento:  '',
        descricao:           String(linha[COL_BNCC_V1.DESCRICAO]      || ''),
        nivelBloom:          String(linha[COL_BNCC_V1.NIVEL_BLOOM]    || 'Compreender'),
        nivelBloomNum:       0,
        competenciasGerais:  [],
        descritoresSAEB:     [],
        habEJAEquiv:         [],
        palavrasChave:       [],
        totalUso:            0,
        observacoes:         ''
      };
    } else {
      _cacheBNCC[codigo] = {
        codigo,
        prefixo:             String(linha[COL_BNCC.PREFIXO]             || segmentoBNCC(codigo) || 'EF'),
        componente:          String(linha[COL_BNCC.COMPONENTE]           || ''),
        areaConhecimento:    String(linha[COL_BNCC.AREA_CONHECIMENTO]    || ''),
        anoSerie:            String(linha[COL_BNCC.ANO_SERIE]            || ''),
        anoNumero:           parseInt(linha[COL_BNCC.ANO_NUMERO], 10)    || 0,
        campoTematico:       String(linha[COL_BNCC.CAMPO_TEMATICO]       || ''),
        unidadeTematica:     String(linha[COL_BNCC.UNIDADE_TEMATICA]     || ''),
        objetoConhecimento:  String(linha[COL_BNCC.OBJETO_CONHECIMENTO]  || ''),
        descricao:           String(linha[COL_BNCC.DESCRICAO]            || ''),
        nivelBloom:          String(linha[COL_BNCC.NIVEL_BLOOM]          || 'Compreender'),
        nivelBloomNum:       parseInt(linha[COL_BNCC.NIVEL_BLOOM_NUM], 10) || 0,
        competenciasGerais:  String(linha[COL_BNCC.COMPETENCIAS_GERAIS]  || '').split(';').map(s => s.trim()).filter(Boolean),
        descritoresSAEB:     String(linha[COL_BNCC.DESCRITORES_SAEB]     || '').split(';').map(s => s.trim()).filter(Boolean),
        habEJAEquiv:         String(linha[COL_BNCC.HAB_EJA_EQUIV]        || '').split(';').map(s => s.trim()).filter(Boolean),
        palavrasChave:       String(linha[COL_BNCC.PALAVRAS_CHAVE]       || '').split(';').map(s => s.trim()).filter(Boolean),
        totalUso:            parseInt(linha[COL_BNCC.TOTAL_USO], 10)     || 0,
        observacoes:         String(linha[COL_BNCC.OBSERVACOES]          || '')
      };
    }
  });

  // Persistir no CacheService
  _salvarCacheBNCCNoService(_cacheBNCC);

  registrarLog('INFO', `Cache BNCC carregado da planilha: ${Object.keys(_cacheBNCC).length} habilidades (schema ${isV1 ? 'v1' : 'v2'})`);
  return _cacheBNCC;
}

/**
 * Salva o cache BNCC em chunks no CacheService.
 * @private
 */
function _salvarCacheBNCCNoService(cache) {
  try {
    const valores = Object.values(cache);
    const totalChunks = Math.ceil(valores.length / BNCC_CHUNK_SIZE);
    const svc = CacheService.getScriptCache();

    for (let i = 0; i < totalChunks; i++) {
      const chunk = valores.slice(i * BNCC_CHUNK_SIZE, (i + 1) * BNCC_CHUNK_SIZE);
      svc.put(BNCC_CACHE_PREFIX + i, JSON.stringify(chunk), BNCC_CACHE_TTL);
    }
    svc.put(BNCC_CACHE_META, JSON.stringify({ totalChunks, count: valores.length }), BNCC_CACHE_TTL);
  } catch (_) { /* CacheService indisponível — ignorar */ }
}

/**
 * Invalida o cache BNCC (memória + CacheService).
 * Chamar após atualizar a planilha MASTER_BNCC.
 */
function invalidarCacheBNCC() {
  _cacheBNCC = null;
  try {
    const svc = CacheService.getScriptCache();
    const metaStr = svc.get(BNCC_CACHE_META);
    if (metaStr) {
      const meta = JSON.parse(metaStr);
      const chaves = [BNCC_CACHE_META];
      for (let i = 0; i < meta.totalChunks; i++) chaves.push(BNCC_CACHE_PREFIX + i);
      svc.removeAll(chaves);
    }
  } catch (_) {}
  registrarLog('INFO', 'Cache BNCC invalidado');
}

// ============================================================
// FUNÇÕES PÚBLICAS — CONSULTA
// ============================================================

/**
 * Busca os dados completos de uma habilidade BNCC pelo código.
 * Esta é a função de enforcement da regra "NUNCA habilidades fictícias".
 *
 * @param {string} codigo - Código BNCC (ex: 'EF06LP05', 'EM13CNT201', 'EI01ET01')
 * @throws {Error} Se o código não existir no catálogo MASTER_BNCC
 * @returns {Object} Dados completos da habilidade
 */
function buscarHabilidadeBNCC(codigo) {
  const codigoNorm = String(codigo || '').trim().toUpperCase();

  if (!validarCodigoBNCC(codigoNorm)) {
    throw new Error(
      `Código BNCC inválido: "${codigoNorm}". ` +
      `Formatos aceitos: EF06LP05 (EF), EI01ET01 (EI), EM13CNT201 (EM), CM06LP01 (Municipal). ` +
      `Use apenas códigos cadastrados no MASTER_BNCC.`
    );
  }

  const cache = _obterCacheBNCC();
  const habilidade = cache[codigoNorm];

  if (!habilidade) {
    throw new Error(
      `Habilidade BNCC não encontrada no catálogo: "${codigoNorm}". ` +
      `Verifique se ela está cadastrada na planilha MASTER_BNCC e está ativa. ` +
      `NUNCA invente ou suponha códigos BNCC.`
    );
  }

  return habilidade;
}

/**
 * Verifica se um código BNCC existe no catálogo (sem lançar exceção).
 * @param {string} codigo
 * @returns {boolean}
 */
function validarHabilidadeExiste(codigo) {
  try {
    buscarHabilidadeBNCC(codigo);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Lista habilidades ativas filtradas por ano e componente.
 * Suporta busca parcial nos dois campos.
 *
 * @param {string} anoSerie   - Ex: '6º Ano', 'EJA Segmento II', 'Infantil'
 * @param {string} componente - Nome completo (ex: 'Língua Portuguesa')
 * @returns {Object[]}
 */
function listarHabilidadesPorAnoComponente(anoSerie, componente) {
  const cache = _obterCacheBNCC();
  const anoNorm  = normalizar(anoSerie);
  const compNorm = normalizar(componente);
  return Object.values(cache).filter(h =>
    normalizar(h.anoSerie).includes(anoNorm) &&
    normalizar(h.componente).includes(compNorm)
  );
}

/**
 * Busca habilidades por texto livre em descrição, código e palavras-chave.
 * Usado no autocomplete da sidebar (Sprint 4).
 *
 * @param {string} texto  - Texto a buscar
 * @param {number} [limite=20] - Máximo de resultados
 * @param {string} [componente] - Filtro adicional por componente
 * @returns {Object[]} Habilidades encontradas (ordenadas por relevância)
 */
function buscarHabilidadesPorTexto(texto, limite, componente) {
  if (!texto || texto.trim().length < 2) return [];
  const cache = _obterCacheBNCC();
  const termos = normalizar(texto).split(/\s+/).filter(Boolean);
  const maxResult = limite || 20;
  const compNorm = componente ? normalizar(componente) : null;

  const pontuados = Object.values(cache)
    .filter(h => !compNorm || normalizar(h.componente).includes(compNorm))
    .map(h => {
      const haystack = normalizar(
        [h.codigo, h.descricao, h.campoTematico, h.unidadeTematica, h.palavrasChave.join(' ')].join(' ')
      );
      const pontos = termos.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      // Código exato vale mais
      const codigoExato = h.codigo.toLowerCase().includes(texto.toLowerCase().trim()) ? 5 : 0;
      return { habilidade: h, pontos: pontos + codigoExato };
    })
    .filter(p => p.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, maxResult)
    .map(p => p.habilidade);

  return pontuados;
}

/**
 * Valida um array de códigos BNCC.
 * @param {string[]} codigos
 * @returns {{validos: string[], invalidos: string[]}}
 */
function validarArrayCodigos(codigos) {
  const resultado = { validos: [], invalidos: [] };
  (codigos || []).forEach(codigo => {
    if (validarHabilidadeExiste(codigo)) resultado.validos.push(codigo);
    else resultado.invalidos.push(codigo);
  });
  return resultado;
}

/**
 * Formata uma habilidade BNCC para inclusão em prompts do Gemini.
 * Inclui dados enriquecidos do schema v2 quando disponíveis.
 *
 * @param {string} codigo
 * @returns {string}
 */
function formatarHabilidadeParaPrompt(codigo) {
  const h = buscarHabilidadeBNCC(codigo);
  let texto = `${h.codigo} — ${h.descricao} (${h.componente}, ${h.anoSerie})`;
  if (h.nivelBloom)       texto += ` | Bloom: ${h.nivelBloom}`;
  if (h.unidadeTematica)  texto += ` | Unidade: ${h.unidadeTematica}`;
  return texto;
}

// ============================================================
// PROGRESSÃO VERTICAL (Sprint 4)
// ============================================================

/**
 * Retorna habilidades do mesmo eixo/campo temático em outros anos.
 * Permite ao professor ver o que veio antes e o que virá depois.
 *
 * @param {string} codigoBNCC - Habilidade de referência
 * @returns {{anterior: Object[], proximos: Object[]}}
 */
function buscarProgressaoVertical(codigoBNCC) {
  const habilidade = buscarHabilidadeBNCC(codigoBNCC);
  const cache = _obterCacheBNCC();
  const compNorm  = normalizar(habilidade.componente);
  const campoNorm = normalizar(habilidade.campoTematico);
  const anoRef    = habilidade.anoNumero;

  const relacionadas = Object.values(cache).filter(h =>
    h.codigo !== codigoBNCC &&
    normalizar(h.componente).includes(compNorm) &&
    (campoNorm === '' || normalizar(h.campoTematico).includes(campoNorm.substring(0, 8)))
  );

  return {
    anterior: relacionadas.filter(h => h.anoNumero > 0 && h.anoNumero < anoRef)
                          .sort((a, b) => b.anoNumero - a.anoNumero),
    proximos: relacionadas.filter(h => h.anoNumero > anoRef)
                          .sort((a, b) => a.anoNumero - b.anoNumero)
  };
}

// ============================================================
// EQUIVALENTES EJA (Sprint 4)
// ============================================================

/**
 * Retorna habilidades do EF regular equivalentes para uso em turmas EJA.
 * @param {string} codigoBNCC
 * @returns {Object[]} Habilidades equivalentes
 */
function buscarEquivalentesEJA(codigoBNCC) {
  const cache = _obterCacheBNCC();

  // 1. Verificar campo habEJAEquiv da própria habilidade
  if (cache[codigoBNCC] && cache[codigoBNCC].habEJAEquiv.length > 0) {
    return cache[codigoBNCC].habEJAEquiv
      .filter(c => cache[c])
      .map(c => cache[c]);
  }

  // 2. Buscar no Mapeamento_EJA
  try {
    const config = getConfig();
    const dados = lerAba(config.SHEETS.MASTER_BNCC, ABAS_BNCC.MAPEAMENTO_EJA);
    return dados.slice(1)
      .filter(l => String(l[0]).toUpperCase() === codigoBNCC.toUpperCase())
      .map(l => cache[String(l[1]).toUpperCase()])
      .filter(Boolean);
  } catch (_) { return []; }
}

// ============================================================
// COMPETÊNCIAS GERAIS (Sprint 4)
// ============================================================

/**
 * Retorna as competências gerais da BNCC relacionadas a uma habilidade.
 * @param {string} codigoBNCC
 * @returns {Object[]} Competências gerais
 */
function buscarCompetenciasGerais(codigoBNCC) {
  const habilidade = buscarHabilidadeBNCC(codigoBNCC);
  if (!habilidade.competenciasGerais || habilidade.competenciasGerais.length === 0) return [];

  try {
    const config = getConfig();
    const dados = lerAba(config.SHEETS.MASTER_BNCC, ABAS_BNCC.COMPETENCIAS);
    const numeros = new Set(habilidade.competenciasGerais.map(n => String(n).trim()));
    return dados.slice(1)
      .filter(l => numeros.has(String(l[0]).trim()))
      .map(l => ({
        numero:      String(l[0] || '').trim(),
        titulo:      String(l[1] || '').trim(),
        descricao:   String(l[2] || '').trim()
      }));
  } catch (_) { return []; }
}

// ============================================================
// DESCRITORES SAEB
// ============================================================

/**
 * Busca descritores SAEB associados a um código BNCC.
 * Usa campo do cache quando disponível (evita leitura extra da planilha).
 *
 * @param {string} codigoBNCC
 * @returns {string[]}
 */
function buscarDescritoresSAEB(codigoBNCC) {
  const cache = _obterCacheBNCC();
  if (cache[codigoBNCC] && cache[codigoBNCC].descritoresSAEB.length > 0) {
    return cache[codigoBNCC].descritoresSAEB;
  }

  // Fallback: aba Descritores_SAEB
  const config = getConfig();
  if (!config.SHEETS.MASTER_BNCC) return [];
  try {
    const dados = lerAba(config.SHEETS.MASTER_BNCC, ABAS_BNCC.DESCRITORES);
    return dados.slice(1)
      .filter(l => String(l[0] || '').trim().toUpperCase() === codigoBNCC.toUpperCase())
      .map(l => String(l[1] || '').trim())
      .filter(d => d.length > 0);
  } catch (_) { return []; }
}

// ============================================================
// REGISTRO DE USO (Sprint 4)
// ============================================================

/**
 * Incrementa o contador de uso de uma habilidade na planilha.
 * Chamado automaticamente ao gerar plano de aula ou questão.
 * Operação assíncrona e tolerante a falhas (não bloqueia o fluxo principal).
 *
 * @param {string} codigoBNCC
 */
function registrarUsoHabilidade(codigoBNCC) {
  try {
    const config = getConfig();
    if (!config.SHEETS.MASTER_BNCC) return;

    // Schema v2 necessário para coluna TOTAL_USO
    const ss  = SpreadsheetApp.openById(config.SHEETS.MASTER_BNCC);
    const aba = ss.getSheetByName(ABAS_BNCC.HABILIDADES);
    if (!aba || aba.getLastColumn() < COL_BNCC.TOTAL_USO + 1) return;

    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
      if (String(dados[i][COL_BNCC.CODIGO]).toUpperCase() === codigoBNCC.toUpperCase()) {
        const usoAtual = parseInt(dados[i][COL_BNCC.TOTAL_USO], 10) || 0;
        aba.getRange(i + 1, COL_BNCC.TOTAL_USO + 1).setValue(usoAtual + 1);
        // Invalidar cache para refletir o novo contador
        invalidarCacheBNCC();
        break;
      }
    }
  } catch (_) { /* falha silenciosa — uso é estatística, não crítico */ }
}

/**
 * Retorna as habilidades mais usadas para um componente/ano.
 * Útil para sugestões no formulário de plano de aula.
 *
 * @param {string} [componente]
 * @param {string} [anoSerie]
 * @param {number} [limite=10]
 * @returns {Object[]}
 */
function listarHabilidadesMaisUsadas(componente, anoSerie, limite) {
  const cache = _obterCacheBNCC();
  let habilidades = Object.values(cache).filter(h => h.totalUso > 0);

  if (componente) {
    const compNorm = normalizar(componente);
    habilidades = habilidades.filter(h => normalizar(h.componente).includes(compNorm));
  }
  if (anoSerie) {
    const anoNorm = normalizar(anoSerie);
    habilidades = habilidades.filter(h => normalizar(h.anoSerie).includes(anoNorm));
  }

  return habilidades
    .sort((a, b) => b.totalUso - a.totalUso)
    .slice(0, limite || 10);
}

// ============================================================
// IMPORTAÇÃO
// ============================================================

/**
 * Importa habilidades BNCC de outra planilha Google Sheets.
 * Compatível com schema v1 e v2. Idempotente (ignora duplicatas).
 *
 * @param {string} spreadsheetId - ID da planilha de origem
 * @returns {{inseridos: number, pulados: number, total: number}}
 */
function importarBNCCDeSpreadsheet(spreadsheetId) {
  const idLimpo = String(spreadsheetId || '').trim();
  if (!idLimpo) throw new Error('ID da planilha de origem não informado.');

  const config = getConfig();
  const sheetIdDestino = config.SHEETS.MASTER_BNCC;
  if (!sheetIdDestino) throw new Error('Planilha MASTER_BNCC não configurada. Execute o Setup Inicial primeiro.');

  let ssOrigem;
  try {
    ssOrigem = SpreadsheetApp.openById(idLimpo);
  } catch (_) {
    throw new Error('Não foi possível abrir a planilha de origem. Verifique o ID e as permissões.');
  }

  const abaOrigem = ssOrigem.getSheetByName(ABAS_BNCC.HABILIDADES);
  if (!abaOrigem) throw new Error('Aba "Habilidades" não encontrada na planilha de origem.');

  const dadosOrigem = abaOrigem.getDataRange().getValues();
  if (dadosOrigem.length < 2) throw new Error('A planilha de origem não tem dados além do cabeçalho.');

  const linhas = dadosOrigem.slice(1).filter(r => String(r[0]).trim());
  const ssDestino  = SpreadsheetApp.openById(sheetIdDestino);
  const abaDestino = ssDestino.getSheetByName(ABAS_BNCC.HABILIDADES);
  if (!abaDestino) throw new Error('Aba "Habilidades" não encontrada na MASTER_BNCC.');

  const existentes = new Set(
    abaDestino.getDataRange().getValues().slice(1)
      .map(r => String(r[0]).toUpperCase().trim())
  );

  const totalColsDest = abaDestino.getLastColumn();
  const isDestinoV2 = totalColsDest >= 18;

  const linhasNovas = [];
  linhas.forEach(r => {
    const codigo = String(r[0]).trim().toUpperCase();
    if (!codigo || existentes.has(codigo)) return;
    if (isDestinoV2) {
      // Schema v2 completo
      linhasNovas.push([
        codigo,                              // CODIGO
        segmentoBNCC(codigo) || 'EF',       // PREFIXO
        String(r[1] || '').trim(),          // COMPONENTE
        String(r[2] || '').trim(),          // AREA_CONHECIMENTO
        String(r[3] || r[2] || '').trim(),  // ANO_SERIE
        0,                                   // ANO_NUMERO
        String(r[4] || r[3] || '').trim(),  // CAMPO_TEMATICO
        '',                                  // UNIDADE_TEMATICA
        '',                                  // OBJETO_CONHECIMENTO
        String(r[5] || r[4] || '').trim(),  // DESCRICAO
        String(r[6] || r[5] || 'Compreender').trim(), // NIVEL_BLOOM
        0, '', '', '', '',                   // BLOOM_NUM, CG, SAEB, EJA, PALAVRAS
        0,                                   // TOTAL_USO
        String(r[7] || r[6] || 'TRUE').trim(), // ATIVO
        ''                                   // OBSERVACOES
      ]);
    } else {
      linhasNovas.push([
        codigo,
        String(r[1] || '').trim(),
        String(r[2] || '').trim(),
        String(r[3] || '').trim(),
        String(r[4] || '').trim(),
        String(r[5] || 'Compreender').trim(),
        String(r[6] || 'TRUE').trim()
      ]);
    }
    existentes.add(codigo);
  });

  if (linhasNovas.length > 0) {
    abaDestino.getRange(abaDestino.getLastRow() + 1, 1, linhasNovas.length, linhasNovas[0].length)
              .setValues(linhasNovas);
  }

  invalidarCacheBNCC();
  registrarLog('INFO',
    `Import BNCC: ${linhasNovas.length} inseridas, ${linhas.length - linhasNovas.length} puladas`
  );

  return { inseridos: linhasNovas.length, pulados: linhas.length - linhasNovas.length, total: linhas.length };
}
