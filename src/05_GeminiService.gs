/**
 * PEDAGOGO.AI — Gateway Multi-Provider de IA
 * Arquivo: 05_GeminiService.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * ÚNICO ponto de saída para chamadas a qualquer API de IA.
 * Nenhum outro módulo deve chamar UrlFetchApp diretamente.
 * Providers suportados: Gemini, OpenRouter, Ollama.
 * Garante: autenticação segura, logging, retry, e controle de dados (LGPD).
 *
 * Referência: Bloco 2.2 (endpoint), Bloco 6.1 (system prompt),
 *             Bloco 8.1 (controle de saída de dados) do prompt mestre
 */

// ============================================================
// CONFIGURAÇÕES DOS PROVIDERS
// ============================================================

const GEMINI_CONFIG = Object.freeze({
  ENDPOINT:    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  MAX_RETRIES: 3,
  RETRY_DELAY: 3000,  // ms base — aplicado com backoff exponencial (×2 a cada tentativa)
  DEFAULTS: {
    temperature:     0.7,
    maxOutputTokens: 4096,
    topK:            40,
    topP:            0.95
  }
});

const OPENROUTER_CONFIG = Object.freeze({
  ENDPOINT:    'https://openrouter.ai/api/v1/chat/completions',
  MAX_RETRIES: 3,
  RETRY_DELAY: 3000,
  DEFAULTS: {
    temperature:     0.7,
    maxOutputTokens: 4096
  }
});

const OLLAMA_CONFIG = Object.freeze({
  // Endpoint montado dinamicamente em _chamarOllama via getOllamaEndpoint()
  PATH:        '/v1/chat/completions',  // compatível OpenAI
  MAX_RETRIES: 2,
  RETRY_DELAY: 2000,
  DEFAULTS: {
    temperature:     0.7,
    maxOutputTokens: 4096
  }
});

// ============================================================
// SYSTEM PROMPT DO PEDAGOGO.AI (Bloco 6.1)
// ============================================================

/**
 * Retorna o system prompt completo do PEDAGOGO.AI.
 * Inclui identidade, tom, conhecimentos obrigatórios e limites do sistema.
 * Este texto é prefixado em TODAS as chamadas ao Gemini.
 *
 * @returns {string} System prompt em Português Brasileiro
 */
function construirSystemPrompt() {
  return `Você é o PEDAGOGO.AI, assistente de IA do Colégio Municipal de Itabatan, integrado ao Google Workspace. Seu comportamento é governado pelas seguintes regras absolutas:

IDENTIDADE E TOM:
• Idioma: Português Brasileiro formal-pedagógico (nunca use inglês sem tradução)
• Tom: Acolhedor, respeitoso e motivador com professores; técnico com coordenação
• Nunca critique o professor ou aluno. Foque sempre em soluções e crescimento.
• Instituição: Colégio Municipal de Itabatan | SEME/Mucuri-BA

CONHECIMENTOS OBRIGATÓRIOS:
• BNCC completa (Ed. Infantil ao Ensino Médio, incluindo EJA)
• Taxonomia de Bloom revisada (6 níveis cognitivos: Lembrar, Compreender, Aplicar, Analisar, Avaliar, Criar)
• Diretrizes da EJA: Parecer CNE/CEB nº 11/2000, Decreto 5.840/2006 (PROEJA)
• Lei de Diretrizes e Bases da Educação Nacional (LDBEN 9.394/1996)
• Legislação de inclusão: LBI 13.146/2015, Política Nacional de Ed. Especial
• LGPD aplicada à educação (Lei 13.709/2018) — nunca revele dados pessoais de alunos
• Lei nº 15.100/2025 (uso de celular em sala de aula)

CAPACIDADES ATIVAS:
✅ Gerar planos de aula estruturados com habilidades BNCC reais
✅ Criar questões objetivas e discursivas com gabarito e rubrica
✅ Montar provas equilibradas por dificuldade e habilidade
✅ Analisar resultados e identificar gargalos pedagógicos
✅ Produzir PEI/PDI para alunos com NEE
✅ Adaptar conteúdo para EJA (valorização de saberes prévios, contexto adulto)
✅ Gerar comunicados, atas, relatórios e pareceres pedagógicos
✅ Sugerir intervenções baseadas em dados de desempenho

LIMITES INVIOLÁVEIS:
❌ NUNCA invente habilidades BNCC — use apenas códigos do catálogo MASTER_BNCC
❌ Não acesse dados pessoais de alunos sem permissão explícita do usuário
❌ Não emita diagnósticos médicos, psicológicos ou laudos de qualquer natureza
❌ Não substitua a decisão humana em casos de reprovação, progressão ou exclusão
❌ Não compartilhe dados com sistemas externos sem consentimento do gestor`;
}

// ============================================================
// FUNÇÃO PRINCIPAL DE CHAMADA (API pública — não alterar assinatura)
// ============================================================

/**
 * Realiza uma chamada ao provider de IA ativo com retry automático.
 * Esta é a ÚNICA função que deve fazer UrlFetchApp para qualquer API de IA.
 * O provider ativo é definido pela propriedade PROVEDOR_IA_ATIVO no PropertiesService.
 *
 * @param {string} prompt - Texto do prompt (sem o system prompt — adicionado automaticamente)
 * @param {Object} [opcoes] - Opções de geração { temperature, maxOutputTokens, incluirSystemPrompt }
 * @returns {string} Texto gerado pelo modelo
 * @throws {Error} Se a API retornar erro após todas as tentativas
 */
function chamarGemini(prompt, opcoes) {
  const incluirSystem = !(opcoes && opcoes.incluirSystemPrompt === false);

  const promptFinal = incluirSystem
    ? `${construirSystemPrompt()}\n\n---\n\n${prompt}`
    : prompt;

  return _despacharIA(promptFinal, opcoes || {});
}

// ============================================================
// DESPACHANTE — roteia para o provider ativo
// ============================================================

/**
 * Lê PROVEDOR_IA_ATIVO e despacha para o provider correto.
 * @param {string} promptFinal - Prompt já com system prompt incluído
 * @param {Object} opcoes - Opções de geração
 * @returns {string} Texto gerado
 */
function _despacharIA(promptFinal, opcoes) {
  const provider = getProvedorAtivo();

  switch (provider) {
    case 'gemini':
      return _chamarGeminiInterno(promptFinal, opcoes);
    case 'openrouter':
      return _chamarOpenRouter(promptFinal, opcoes);
    case 'ollama':
      return _chamarOllama(promptFinal, opcoes);
    default:
      throw new Error(
        `Provider de IA desconhecido: "${provider}". ` +
        'Configure em ⚙️ Configurar IA → Provider. Valores válidos: gemini, openrouter, ollama.'
      );
  }
}

// ============================================================
// PROVIDER 1 — GEMINI
// ============================================================

/**
 * Chamada interna ao Gemini com retry/backoff.
 * @param {string} promptFinal - Prompt completo
 * @param {Object} opcoes - Opções de geração
 * @returns {string} Texto gerado
 */
function _chamarGeminiInterno(promptFinal, opcoes) {
  const config = Object.assign({}, GEMINI_CONFIG.DEFAULTS, opcoes);

  const payload = {
    contents: [{
      parts: [{ text: promptFinal }]
    }],
    generationConfig: {
      temperature:     config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      topK:            config.topK,
      topP:            config.topP
    }
  };

  const chave = getGeminiKey();
  const opcoesFetch = {
    method:      'POST',
    contentType: 'application/json',
    headers:     { 'x-goog-api-key': chave },
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true
  };

  let ultimoErro;
  for (let tentativa = 0; tentativa <= GEMINI_CONFIG.MAX_RETRIES; tentativa++) {
    if (tentativa > 0) {
      const delay = GEMINI_CONFIG.RETRY_DELAY * Math.pow(2, tentativa - 1);
      registrarLog('ALERTA', `Tentativa ${tentativa + 1} de chamada ao Gemini — aguardando ${delay}ms`);
      Utilities.sleep(delay);
    }

    try {
      const response = UrlFetchApp.fetch(GEMINI_CONFIG.ENDPOINT, opcoesFetch);
      const status = response.getResponseCode();

      if (status === 200) {
        const json = JSON.parse(response.getContentText());
        const texto = _extrairTextoResposta(json);
        registrarLog('INFO', 'Chamada Gemini bem-sucedida', `${texto.length} caracteres gerados`);
        return texto;
      }

      const erro = _tratarErroGemini(status, response.getContentText());
      if (status === 429) throw new Error(erro);
      if (status === 503 || status === 500) { ultimoErro = erro; continue; }
      throw new Error(erro);

    } catch (e) {
      if (e.message.includes('Gemini')) throw e;
      ultimoErro = e.message;
      registrarLog('ERRO', `Falha na chamada Gemini (tentativa ${tentativa + 1}): ${e.message}`);
    }
  }

  throw new Error(`Gemini — Falha após ${GEMINI_CONFIG.MAX_RETRIES + 1} tentativas: ${ultimoErro}`);
}

// ============================================================
// PROVIDER 2 — OPENROUTER
// ============================================================

/**
 * Chamada ao OpenRouter (compatível OpenAI chat completions).
 * System prompt é enviado como messages[0] com role "system".
 * @param {string} promptFinal - Prompt completo (já inclui system prompt como texto)
 * @param {Object} opcoes - Opções de geração
 * @returns {string} Texto gerado
 */
function _chamarOpenRouter(promptFinal, opcoes) {
  const config = Object.assign({}, OPENROUTER_CONFIG.DEFAULTS, opcoes);
  const chave  = getOpenRouterKey();
  const modelo = getOpenRouterModel();

  // OpenRouter usa formato messages[] — separamos system/user para melhor compatibilidade
  const SEPARADOR = '\n\n---\n\n';
  let messages;
  const idx = promptFinal.indexOf(SEPARADOR);
  if (idx !== -1) {
    messages = [
      { role: 'system', content: promptFinal.substring(0, idx) },
      { role: 'user',   content: promptFinal.substring(idx + SEPARADOR.length) }
    ];
  } else {
    messages = [{ role: 'user', content: promptFinal }];
  }

  const payload = {
    model:       modelo,
    messages:    messages,
    temperature: config.temperature,
    max_tokens:  config.maxOutputTokens
  };

  const opcoesFetch = {
    method:      'POST',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${chave}`,
      'HTTP-Referer':  'https://script.google.com',
      'X-Title':       'PEDAGOGO.AI'
    },
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true
  };

  let ultimoErro;
  for (let tentativa = 0; tentativa <= OPENROUTER_CONFIG.MAX_RETRIES; tentativa++) {
    if (tentativa > 0) {
      const delay = OPENROUTER_CONFIG.RETRY_DELAY * Math.pow(2, tentativa - 1);
      registrarLog('ALERTA', `OpenRouter — tentativa ${tentativa + 1} — aguardando ${delay}ms`);
      Utilities.sleep(delay);
    }

    try {
      const response = UrlFetchApp.fetch(OPENROUTER_CONFIG.ENDPOINT, opcoesFetch);
      const status = response.getResponseCode();

      if (status === 200) {
        const json = JSON.parse(response.getContentText());
        const texto = _extrairTextoOpenAI(json, 'OpenRouter');
        registrarLog('INFO', `OpenRouter (${modelo}) bem-sucedido`, `${texto.length} caracteres gerados`);
        return texto;
      }

      const corpo = response.getContentText();
      const erro  = _tratarErroOpenAI(status, corpo, 'OpenRouter');
      if (status === 429) throw new Error(erro);
      if (status === 500 || status === 503) { ultimoErro = erro; continue; }
      throw new Error(erro);

    } catch (e) {
      if (e.message.startsWith('OpenRouter')) throw e;
      ultimoErro = e.message;
      registrarLog('ERRO', `Falha OpenRouter (tentativa ${tentativa + 1}): ${e.message}`);
    }
  }

  throw new Error(`OpenRouter — Falha após ${OPENROUTER_CONFIG.MAX_RETRIES + 1} tentativas: ${ultimoErro}`);
}

// ============================================================
// PROVIDER 3 — OLLAMA
// ============================================================

/**
 * Chamada ao Ollama via endpoint público (compatível OpenAI /v1/chat/completions).
 * ATENÇÃO: Apps Script roda nos servidores do Google — Ollama precisa de URL pública.
 * @param {string} promptFinal - Prompt completo
 * @param {Object} opcoes - Opções de geração
 * @returns {string} Texto gerado
 */
function _chamarOllama(promptFinal, opcoes) {
  const config   = Object.assign({}, OLLAMA_CONFIG.DEFAULTS, opcoes);
  const endpoint = getOllamaEndpoint();
  const modelo   = getOllamaModel();
  const url      = endpoint.replace(/\/$/, '') + OLLAMA_CONFIG.PATH;

  const SEPARADOR = '\n\n---\n\n';
  let messages;
  const idx = promptFinal.indexOf(SEPARADOR);
  if (idx !== -1) {
    messages = [
      { role: 'system', content: promptFinal.substring(0, idx) },
      { role: 'user',   content: promptFinal.substring(idx + SEPARADOR.length) }
    ];
  } else {
    messages = [{ role: 'user', content: promptFinal }];
  }

  const payload = {
    model:       modelo,
    messages:    messages,
    temperature: config.temperature,
    max_tokens:  config.maxOutputTokens,
    stream:      false  // Apps Script não suporta streaming
  };

  const opcoesFetch = {
    method:      'POST',
    contentType: 'application/json',
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true
  };

  let ultimoErro;
  for (let tentativa = 0; tentativa <= OLLAMA_CONFIG.MAX_RETRIES; tentativa++) {
    if (tentativa > 0) {
      const delay = OLLAMA_CONFIG.RETRY_DELAY * Math.pow(2, tentativa - 1);
      registrarLog('ALERTA', `Ollama — tentativa ${tentativa + 1} — aguardando ${delay}ms`);
      Utilities.sleep(delay);
    }

    try {
      const response = UrlFetchApp.fetch(url, opcoesFetch);
      const status = response.getResponseCode();

      if (status === 200) {
        const json = JSON.parse(response.getContentText());
        const texto = _extrairTextoOpenAI(json, 'Ollama');
        registrarLog('INFO', `Ollama (${modelo}) bem-sucedido`, `${texto.length} caracteres gerados`);
        return texto;
      }

      const corpo = response.getContentText();
      const erro  = _tratarErroOpenAI(status, corpo, 'Ollama');
      if (status === 500 || status === 503) { ultimoErro = erro; continue; }
      throw new Error(erro);

    } catch (e) {
      if (e.message.startsWith('Ollama')) throw e;
      ultimoErro = e.message;
      registrarLog('ERRO', `Falha Ollama (tentativa ${tentativa + 1}): ${e.message}`);
    }
  }

  throw new Error(`Ollama — Falha após ${OLLAMA_CONFIG.MAX_RETRIES + 1} tentativas: ${ultimoErro}`);
}

/**
 * Realiza chamada ao provider de IA esperando resposta em JSON.
 * Valida e parseia o JSON retornado.
 *
 * @param {string} prompt - Texto do prompt
 * @param {Object} [opcoes] - Opções de geração
 * @returns {Object} Objeto JavaScript parseado do JSON retornado
 * @throws {Error} Se a resposta não for JSON válido
 */
function chamarGeminiJSON(prompt, opcoes) {
  const promptJSON = `${prompt}

FORMATO OBRIGATÓRIO DE RESPOSTA: Retorne APENAS um objeto JSON válido, sem texto adicional, sem markdown, sem blocos de código. Apenas o JSON puro.`;

  const texto = chamarGemini(promptJSON, opcoes);

  // Tentar extrair JSON da resposta (remover possíveis markdown code blocks)
  const textoLimpo = texto
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(textoLimpo);
  } catch (e) {
    registrarLog('ERRO', 'Resposta da IA não é JSON válido', textoLimpo.substring(0, 200));
    throw new Error(
      'O modelo retornou uma resposta em formato inválido. ' +
      'Tente novamente ou simplifique o prompt.'
    );
  }
}

// ============================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================

/**
 * Extrai o texto de resposta no formato Gemini (candidates[]).
 * @param {Object} json - Resposta parseada da API Gemini
 * @returns {string} Texto gerado
 */
function _extrairTextoResposta(json) {
  if (!json.candidates || json.candidates.length === 0) {
    const motivo = json.promptFeedback && json.promptFeedback.blockReason
      ? json.promptFeedback.blockReason
      : 'resposta vazia';
    throw new Error(`Gemini não retornou candidatos: ${motivo}`);
  }

  const candidate = json.candidates[0];
  if (candidate.finishReason === 'SAFETY') {
    throw new Error(
      'O conteúdo solicitado foi bloqueado por filtros de segurança. ' +
      'Reformule o prompt evitando termos sensíveis.'
    );
  }

  const partes = candidate.content && candidate.content.parts;
  if (!partes || partes.length === 0) {
    throw new Error('Resposta do Gemini sem conteúdo de texto.');
  }

  return partes.map(p => p.text || '').join('');
}

/**
 * Converte código HTTP de erro em mensagem em Português.
 * @param {number} status - Código HTTP
 * @param {string} corpo - Corpo da resposta
 * @returns {string} Mensagem de erro em Português
 */
function _tratarErroGemini(status, corpo) {
  const mensagens = {
    400: 'Requisição inválida ao Gemini. Verifique o formato do prompt.',
    401: 'Chave da API Gemini inválida ou expirada. Verifique as configurações do sistema.',
    403: 'Acesso não autorizado à API Gemini. Verifique as permissões do projeto Google Cloud.',
    404: 'Modelo Gemini não encontrado. O sistema pode precisar de atualização.',
    429: 'Limite de requisições da API Gemini atingido. Aguarde 1-2 minutos e tente novamente. Se persistir, o limite diário foi atingido — verifique o Google AI Studio.',
    500: 'Erro interno do servidor Gemini. Tente novamente em alguns instantes.',
    503: 'Serviço Gemini temporariamente indisponível. Aguarde e tente novamente.'
  };

  const msg = mensagens[status] || `Erro desconhecido da API Gemini (código ${status})`;
  registrarLog('ERRO', msg, corpo ? corpo.substring(0, 300) : '');
  return msg;
}

/**
 * Extrai o texto de resposta no formato OpenAI (choices[0].message.content).
 * Usado por OpenRouter e Ollama.
 * @param {Object} json - Resposta parseada
 * @param {string} nomeProvider - Nome do provider para mensagens de erro
 * @returns {string} Texto gerado
 */
function _extrairTextoOpenAI(json, nomeProvider) {
  if (!json.choices || json.choices.length === 0) {
    throw new Error(`${nomeProvider} não retornou respostas. Verifique o modelo configurado.`);
  }
  const content = json.choices[0].message && json.choices[0].message.content;
  if (!content) {
    const motivo = json.choices[0].finish_reason || 'resposta vazia';
    throw new Error(`${nomeProvider} retornou resposta vazia (finish_reason: ${motivo}).`);
  }
  return content;
}

/**
 * Converte código HTTP de erro em mensagem PT-BR para providers compatíveis OpenAI.
 * @param {number} status - Código HTTP
 * @param {string} corpo - Corpo da resposta
 * @param {string} nomeProvider - Nome do provider (ex: 'OpenRouter', 'Ollama')
 * @returns {string} Mensagem de erro em Português
 */
function _tratarErroOpenAI(status, corpo, nomeProvider) {
  const mensagens = {
    400: `${nomeProvider}: Requisição inválida. Verifique o modelo configurado e o formato do prompt.`,
    401: `${nomeProvider}: Chave de API inválida ou expirada. Verifique em ⚙️ Configurar IA.`,
    402: `${nomeProvider}: Créditos insuficientes. Recarregue sua conta em openrouter.ai.`,
    403: `${nomeProvider}: Acesso negado. Verifique as permissões da chave de API.`,
    404: `${nomeProvider}: Modelo não encontrado. Verifique o slug do modelo em ⚙️ Configurar IA.`,
    429: `${nomeProvider}: Limite de requisições atingido. Aguarde e tente novamente.`,
    500: `${nomeProvider}: Erro interno do servidor. Tente novamente em alguns instantes.`,
    503: `${nomeProvider}: Serviço temporariamente indisponível. Tente novamente em breve.`
  };
  const msg = mensagens[status] || `${nomeProvider}: Erro desconhecido (código ${status}).`;
  registrarLog('ERRO', msg, corpo ? corpo.substring(0, 300) : '');
  return msg;
}
