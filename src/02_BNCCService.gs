/**
 * PEDAGOGO.AI — Serviço de Habilidades BNCC
 * Arquivo: 02_BNCCService.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Gateway único para consulta ao catálogo MASTER_BNCC.
 * REGRA INVIOLÁVEL: Nunca embutir código BNCC em prompt do Gemini
 * sem antes chamar validarHabilidadeExiste().
 *
 * Referência: Bloco 2.1 ("NUNCA gere habilidades BNCC fictícias"),
 *             Bloco 3.1, Bloco 6.1 do prompt mestre
 */

// ============================================================
// NOMES DAS ABAS NA PLANILHA MASTER_BNCC
// ============================================================

const ABAS_BNCC = Object.freeze({
  HABILIDADES:  'Habilidades',
  DESCRITORES:  'Descritores_SAEB',
  COMPETENCIAS: 'Competencias_Gerais'
});

// Índices das colunas na aba Habilidades (base 0)
const COL_BNCC = Object.freeze({
  CODIGO:         0,   // EF06LP05
  COMPONENTE:     1,   // Língua Portuguesa
  ANO_SERIE:      2,   // 6º Ano
  CAMPO_TEMATICO: 3,   // Campo de atuação / Eixo
  DESCRICAO:      4,   // Descrição completa da habilidade
  NIVEL_BLOOM:    5,   // Nível da Taxonomia de Bloom
  ATIVO:          6    // TRUE/FALSE
});

// ============================================================
// CACHE DE HABILIDADES (minimiza chamadas ao Sheets na sessão)
// ============================================================

let _cacheBNCC = null;

/**
 * Carrega ou retorna o cache das habilidades BNCC.
 * @returns {Object} Mapa codigo → dados da habilidade
 */
function _obterCacheBNCC() {
  if (_cacheBNCC) return _cacheBNCC;

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

  dados.slice(1).forEach(linha => {  // Pular cabeçalho
    const codigo = String(linha[COL_BNCC.CODIGO] || '').trim().toUpperCase();
    if (codigo && String(linha[COL_BNCC.ATIVO]).toUpperCase() !== 'FALSE') {
      _cacheBNCC[codigo] = {
        codigo:        codigo,
        componente:    String(linha[COL_BNCC.COMPONENTE]     || ''),
        anoSerie:      String(linha[COL_BNCC.ANO_SERIE]      || ''),
        campoTematico: String(linha[COL_BNCC.CAMPO_TEMATICO] || ''),
        descricao:     String(linha[COL_BNCC.DESCRICAO]      || ''),
        nivelBloom:    String(linha[COL_BNCC.NIVEL_BLOOM]    || '')
      };
    }
  });

  registrarLog('INFO', `Cache BNCC carregado: ${Object.keys(_cacheBNCC).length} habilidades`);
  return _cacheBNCC;
}

/**
 * Invalida o cache (chamar após atualizar a planilha MASTER_BNCC).
 */
function invalidarCacheBNCC() {
  _cacheBNCC = null;
  registrarLog('INFO', 'Cache BNCC invalidado');
}

// ============================================================
// FUNÇÕES PÚBLICAS
// ============================================================

/**
 * Busca os dados completos de uma habilidade BNCC pelo código.
 * Esta é a função de enforcement da regra "NUNCA habilidades fictícias".
 *
 * @param {string} codigo - Código BNCC (ex: 'EF06LP05')
 * @throws {Error} Se o código não existir no catálogo MASTER_BNCC
 * @returns {{codigo, componente, anoSerie, campoTematico, descricao, nivelBloom}}
 */
function buscarHabilidadeBNCC(codigo) {
  const codigoNorm = String(codigo || '').trim().toUpperCase();

  // Validar formato antes de consultar
  if (!validarCodigoBNCC(codigoNorm)) {
    throw new Error(
      `Código BNCC inválido: "${codigoNorm}". ` +
      `O formato correto é EF + 2 dígitos de ano + 2 letras de componente + 2 dígitos. ` +
      `Exemplos: EF06LP05 (ano único) ou EF69LP01 (range 6º–9º ano).`
    );
  }

  const cache = _obterCacheBNCC();
  const habilidade = cache[codigoNorm];

  if (!habilidade) {
    throw new Error(
      `Habilidade BNCC não encontrada no catálogo: "${codigoNorm}". ` +
      `Use apenas habilidades cadastradas na planilha MASTER_BNCC. ` +
      `NUNCA invente ou suponha códigos BNCC.`
    );
  }

  return habilidade;
}

/**
 * Verifica se um código BNCC existe no catálogo (sem lançar exceção).
 * Use este método para validações antes de chamadas ao Gemini.
 *
 * @param {string} codigo - Código BNCC a verificar
 * @returns {boolean} true se existir e estiver ativo
 */
function validarHabilidadeExiste(codigo) {
  try {
    buscarHabilidadeBNCC(codigo);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Lista todas as habilidades ativas para um ano e componente.
 * Usado para popular dropdowns de formulários.
 *
 * @param {string} anoSerie - Ex: '6º Ano', 'EJA Segmento II'
 * @param {string} componente - Nome completo (ex: 'Língua Portuguesa')
 * @returns {Array} Lista de objetos habilidade
 */
function listarHabilidadesPorAnoComponente(anoSerie, componente) {
  const cache = _obterCacheBNCC();
  return Object.values(cache).filter(h =>
    h.anoSerie.toLowerCase().includes(anoSerie.toLowerCase()) &&
    h.componente.toLowerCase().includes(componente.toLowerCase())
  );
}

/**
 * Valida um array de códigos BNCC, retornando os que existem e os que não existem.
 * Útil para validar planilhas importadas.
 *
 * @param {string[]} codigos - Array de códigos a validar
 * @returns {{validos: string[], invalidos: string[]}}
 */
function validarArrayCodigos(codigos) {
  const resultado = { validos: [], invalidos: [] };
  (codigos || []).forEach(codigo => {
    if (validarHabilidadeExiste(codigo)) {
      resultado.validos.push(codigo);
    } else {
      resultado.invalidos.push(codigo);
    }
  });
  return resultado;
}

/**
 * Formata uma habilidade BNCC para inclusão em prompts do Gemini.
 * Garante que o código é válido ANTES de gerar o texto do prompt.
 *
 * @param {string} codigo - Código BNCC validado
 * @returns {string} Texto formatado para o prompt
 */
function formatarHabilidadeParaPrompt(codigo) {
  const h = buscarHabilidadeBNCC(codigo);  // Lança erro se inválido
  return `${h.codigo} — ${h.descricao} (${h.componente}, ${h.anoSerie})`;
}

/**
 * Busca descritores SAEB associados a um código BNCC.
 * Usado na geração de questões estilo SAEB/ENEM.
 *
 * @param {string} codigoBNCC - Código BNCC validado
 * @returns {string[]} Lista de descritores SAEB relacionados
 */
function buscarDescritoresSAEB(codigoBNCC) {
  const config = getConfig();
  const sheetId = config.SHEETS.MASTER_BNCC;
  if (!sheetId) return [];

  try {
    const dados = lerAba(sheetId, ABAS_BNCC.DESCRITORES);
    return dados.slice(1)
      .filter(linha => String(linha[0] || '').trim().toUpperCase() === codigoBNCC.toUpperCase())
      .map(linha => String(linha[1] || '').trim())
      .filter(d => d.length > 0);
  } catch (e) {
    registrarLog('ALERTA', `Não foi possível buscar descritores SAEB para ${codigoBNCC}: ${e.message}`);
    return [];
  }
}
