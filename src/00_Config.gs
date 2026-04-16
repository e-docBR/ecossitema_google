/**
 * PEDAGOGO.AI — Módulo de Configuração Central
 * Arquivo: 00_Config.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * ATENÇÃO: Este é o primeiro arquivo carregado pelo Apps Script (ordem alfabética).
 * Todos os outros módulos dependem das constantes definidas aqui.
 * NUNCA hardcode chaves de API — use sempre PropertiesService.
 *
 * Sprint 2 — CRÍTICO-03: getConfig() agora memoizado via CacheService (1h TTL)
 * para eliminar dezenas de chamadas ao PropertiesService por execução.
 */

// ============================================================
// PAPÉIS DE ACESSO (usados por Seguranca.verificarPermissao)
// ============================================================

const PAPEIS = Object.freeze({
  PROFESSOR:    'professor',
  COORDENADOR:  'coordenador',
  GESTOR:       'gestor',
  ADMIN:        'admin'
});

// ============================================================
// MEMO DE CONFIGURAÇÃO (Sprint 2 — CRÍTICO-03)
// ============================================================

/** Cache em memória para a execução atual */
let _configMemo = null;

/** Chave do CacheService para persistência entre execuções */
const CONFIG_CACHE_KEY = 'PEDAGOGO_CFG_V2';

/**
 * Retorna o objeto de configuração global imutável do PEDAGOGO.AI.
 * Usa cache em memória (por execução) + CacheService (até 1h entre execuções).
 * Invalide com invalidarConfigCache() após chamar salvarPropriedade().
 *
 * @returns {Object} Configuração global
 */
function getConfig() {
  // 1. Memória (mesma execução — mais rápido)
  if (_configMemo) return _configMemo;

  // 2. CacheService (entre execuções — evita PropertiesService)
  try {
    const cached = CacheService.getScriptCache().get(CONFIG_CACHE_KEY);
    if (cached) {
      _configMemo = Object.freeze(JSON.parse(cached));
      return _configMemo;
    }
  } catch (_) { /* CacheService pode falhar em contextos restritos */ }

  // 3. PropertiesService (fonte primária — chamado apenas 1x por ciclo de cache)
  const props = PropertiesService.getScriptProperties();
  const config = {
    // Identidade
    SISTEMA:       'PEDAGOGO.AI',
    ESCOLA:        'Colégio Municipal de 1º e 2º Graus de Itabatan',
    MUNICIPIO:     'Mucuri-BA',
    SECRETARIA:    'SEME/Mucuri-BA',
    TIMEZONE:      'America/Bahia',
    IDIOMA:        'pt-BR',
    VERSAO:        '2.0',

    // IDs das planilhas-mestre (gravados pelo SetupInicial)
    SHEETS: {
      MASTER_BNCC:     props.getProperty('ID_SHEET_MASTER_BNCC')     || '',
      BANCO_QUESTOES:  props.getProperty('ID_SHEET_BANCO_QUESTOES')  || '',
      TURMAS_ALUNOS:   props.getProperty('ID_SHEET_TURMAS_ALUNOS')   || '',
      RESULTADOS:      props.getProperty('ID_SHEET_RESULTADOS')      || ''
    },

    // IDs das pastas no Drive (gravados pelo SetupInicial)
    DRIVE: {
      ROOT:             props.getProperty('ID_PASTA_ROOT')             || '',
      PLANEJAMENTO:     props.getProperty('ID_PASTA_PLANEJAMENTO')     || '',
      AVALIACAO:        props.getProperty('ID_PASTA_AVALIACAO')        || '',
      RESULTADOS:       props.getProperty('ID_PASTA_RESULTADOS')       || '',
      ALUNOS:           props.getProperty('ID_PASTA_ALUNOS')           || '',
      CONFIGURACOES:    props.getProperty('ID_PASTA_CONFIGURACOES')    || '',
      PROFESSORES:      props.getProperty('ID_PASTA_PROFESSORES')      || '',  // Sprint 3
      COMPARTILHADOS:   props.getProperty('ID_PASTA_COMPARTILHADOS')   || ''   // Sprint 3
    },

    // Configurações da API Gemini
    GEMINI: {
      ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      DEFAULTS: {
        temperature:     0.7,
        maxOutputTokens: 4096
      }
    },

    // Limites pedagógicos (LDBEN Art. 24)
    PEDAGOGICO: {
      PERCENTUAL_FALTA_ALERTA:  0.20,  // Alerta preventivo aos 20%
      PERCENTUAL_FALTA_CRITICO: 0.25,  // Limite legal de reprovação (25%)
      NOTA_APROVACAO:           6.0,
      NOTA_RECUPERACAO:         5.0,
      FAIXAS_NOTAS: {
        INSUFICIENTE: { min: 0,   max: 4.9 },
        BASICO:       { min: 5.0, max: 6.9 },
        ADEQUADO:     { min: 7.0, max: 8.9 },
        AVANCADO:     { min: 9.0, max: 10.0 }
      }
    },

    // E-mails institucionais (sobrescritos via PropertiesService em produção)
    EMAIL: {
      COORDENACAO: props.getProperty('EMAIL_COORDENACAO') || '',
      DIRECAO:     props.getProperty('EMAIL_DIRECAO')     || '',
      SECRETARIA:  props.getProperty('EMAIL_SECRETARIA')  || ''
    },

    // Configurações de log
    LOG: {
      NIVEIS:     { INFO: 'INFO', ALERTA: 'ALERTA', ERRO: 'ERRO', AUDITORIA: 'AUDITORIA' },
      ARQUIVO:    'Logs_Sistema.txt',
      MAX_BYTES:  400000  // ~400KB — rotaciona antes de atingir o limite do Drive
    },

    // Classificação de dados LGPD (Bloco 8.1)
    LGPD: {
      PUBLICO:   'PUBLICO',
      RESTRITO:  'RESTRITO',
      SENSIVEL:  'SENSIVEL',
      COLUNAS_SENSIVEIS: [
        'Tipo_NEE', 'Laudo_Medico', 'Situacao_Familiar',
        'Historico_Disciplinar', 'Observacoes_Saude'
      ],
      COLUNAS_RESTRITAS: [
        'Nome_Completo', 'Nota_Individual', 'Frequencia_Individual',
        'Contato_WhatsApp', 'Email_Responsavel', 'Observacoes_Pedagogicas'
      ]
    }
  };

  const frozen = Object.freeze(config);

  // Persistir no CacheService por 1 hora
  try {
    CacheService.getScriptCache().put(CONFIG_CACHE_KEY, JSON.stringify(config), 3600);
  } catch (_) {}

  _configMemo = frozen;
  return frozen;
}

/**
 * Invalida o cache de configuração (em memória + CacheService).
 * DEVE ser chamado após qualquer salvarPropriedade() que altere IDs ou e-mails.
 */
function invalidarConfigCache() {
  _configMemo = null;
  try { CacheService.getScriptCache().remove(CONFIG_CACHE_KEY); } catch (_) {}
}

/**
 * Salva um ID ou valor nas propriedades do script e invalida o cache.
 * @param {string} chave - Chave da propriedade
 * @param {string} valor - Valor a salvar
 */
function salvarPropriedade(chave, valor) {
  PropertiesService.getScriptProperties().setProperty(chave, valor);
  invalidarConfigCache();  // Sprint 2: invalidar após cada escrita
}

/**
 * Retorna o e-mail do usuário ativo na sessão atual.
 * @returns {string} E-mail do usuário
 */
function getUsuarioAtivo() {
  return Session.getActiveUser().getEmail();
}

// ============================================================
// CHAVES DE API — Multi-provider
// ============================================================

/**
 * Retorna a chave da API Gemini armazenada no PropertiesService.
 * @throws {Error} Se a chave não estiver configurada
 * @returns {string} Chave da API Gemini
 */
function getGeminiKey() {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  if (!key) {
    throw new Error(
      'Chave da API Gemini não configurada. ' +
      'Acesse ⚙️ Configurar IA na sidebar e adicione sua chave.'
    );
  }
  return key;
}

/**
 * Retorna o provider de IA ativo.
 * @returns {string} 'gemini' | 'openrouter' | 'ollama'
 */
function getProvedorAtivo() {
  return PropertiesService.getScriptProperties().getProperty('PROVEDOR_IA_ATIVO') || 'gemini';
}

/**
 * Retorna a chave da API OpenRouter.
 * @throws {Error} Se a chave não estiver configurada
 */
function getOpenRouterKey() {
  const key = PropertiesService.getScriptProperties().getProperty('OPENROUTER_KEY');
  if (!key) throw new Error('Chave da API OpenRouter não configurada. Acesse ⚙️ Configurar IA.');
  return key;
}

/**
 * Retorna o slug do modelo OpenRouter.
 */
function getOpenRouterModel() {
  return PropertiesService.getScriptProperties().getProperty('OPENROUTER_MODEL')
    || 'anthropic/claude-3.5-sonnet';
}

/**
 * Retorna o endpoint público do Ollama.
 * @throws {Error} Se o endpoint não estiver configurado
 */
function getOllamaEndpoint() {
  const ep = PropertiesService.getScriptProperties().getProperty('OLLAMA_ENDPOINT');
  if (!ep) throw new Error('Endpoint do Ollama não configurado. Acesse ⚙️ Configurar IA.');
  return ep;
}

/**
 * Retorna o nome do modelo Ollama.
 */
function getOllamaModel() {
  return PropertiesService.getScriptProperties().getProperty('OLLAMA_MODEL') || 'llama3.2';
}

/**
 * Retorna a configuração atual de IA para exibição na UI (chaves mascaradas).
 */
function getConfiguracaoIA() {
  function mascarar(val) {
    if (!val) return '';
    return val.length > 4 ? '••••' + val.slice(-4) : '••••';
  }
  const props = PropertiesService.getScriptProperties();
  return {
    provedorAtivo:    getProvedorAtivo(),
    geminiKey:        mascarar(props.getProperty('GEMINI_KEY')),
    geminiKeyOk:      !!props.getProperty('GEMINI_KEY'),
    openRouterKey:    mascarar(props.getProperty('OPENROUTER_KEY')),
    openRouterKeyOk:  !!props.getProperty('OPENROUTER_KEY'),
    openRouterModel:  getOpenRouterModel(),
    ollamaEndpoint:   props.getProperty('OLLAMA_ENDPOINT') || '',
    ollamaEndpointOk: !!props.getProperty('OLLAMA_ENDPOINT'),
    ollamaModel:      getOllamaModel()
  };
}

/**
 * Persiste a configuração de IA no PropertiesService.
 * Campos em branco são ignorados (não sobrescrevem valores existentes).
 */
function salvarConfiguracaoIA(dados) {
  const props = PropertiesService.getScriptProperties();
  const mapa = {
    provedorAtivo:   'PROVEDOR_IA_ATIVO',
    geminiKey:       'GEMINI_KEY',
    openRouterKey:   'OPENROUTER_KEY',
    openRouterModel: 'OPENROUTER_MODEL',
    ollamaEndpoint:  'OLLAMA_ENDPOINT',
    ollamaModel:     'OLLAMA_MODEL'
  };
  Object.keys(mapa).forEach(function(campo) {
    if (dados[campo] !== undefined && dados[campo] !== '') {
      props.setProperty(mapa[campo], dados[campo]);
    }
  });
  registrarLog('INFO', `Configuração de IA salva — provider: ${getProvedorAtivo()}`);
}

// ============================================================
// TESTE DE CONEXÃO — Multi-provider
// ============================================================

/**
 * Testa a conexão com o provider de IA ativo fazendo uma chamada mínima.
 * @returns {{sucesso: boolean, provider: string, modelo: string, mensagem: string}}
 */
function testarConexaoIA() {
  const provider = getProvedorAtivo();
  let modelo = '';

  try {
    if (provider === 'gemini')      modelo = 'gemini-2.0-flash';
    else if (provider === 'openrouter') modelo = getOpenRouterModel();
    else if (provider === 'ollama')     modelo = getOllamaModel();

    const resposta = chamarGemini('Responda apenas: OK', { incluirSystemPrompt: false, maxOutputTokens: 10 });
    registrarLog('INFO', `Teste de conexão OK — provider: ${provider}, modelo: ${modelo}`);
    return {
      sucesso:  true,
      provider: provider,
      modelo:   modelo,
      mensagem: `✅ Conexão com ${_nomeExibicaoProvider(provider)} (${modelo}) funcionando corretamente.`
    };
  } catch (e) {
    registrarLog('ERRO', `Teste de conexão falhou — provider: ${provider}: ${e.message}`);
    return {
      sucesso:  false,
      provider: provider,
      modelo:   modelo,
      mensagem: e.message
    };
  }
}

/**
 * Retorna o nome de exibição amigável do provider.
 */
function _nomeExibicaoProvider(provider) {
  const nomes = { gemini: 'Google Gemini', openrouter: 'OpenRouter', ollama: 'Ollama' };
  return nomes[provider] || provider;
}
