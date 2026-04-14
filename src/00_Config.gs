/**
 * PEDAGOGO.AI — Módulo de Configuração Central
 * Arquivo: 00_Config.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * ATENÇÃO: Este é o primeiro arquivo carregado pelo Apps Script (ordem alfabética).
 * Todos os outros módulos dependem das constantes definidas aqui.
 * NUNCA hardcode chaves de API — use sempre PropertiesService.
 *
 * Referência: Bloco 1 e Bloco 8.1 do prompt mestre
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
// CONFIGURAÇÃO CENTRAL DO SISTEMA
// ============================================================

/**
 * Retorna o objeto de configuração global imutável do PEDAGOGO.AI.
 * IDs de planilhas e pastas são lidos do PropertiesService após o SetupInicial.
 * @returns {Object} Configuração global
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return Object.freeze({
    // Identidade
    SISTEMA:       'PEDAGOGO.AI',
    ESCOLA:        'Colégio Municipal de 1º e 2º Graus de Itabatan',
    MUNICIPIO:     'Mucuri-BA',
    SECRETARIA:    'SEME/Mucuri-BA',
    TIMEZONE:      'America/Bahia',
    IDIOMA:        'pt-BR',
    VERSAO:        '1.0',

    // IDs das planilhas-mestre (gravados pelo SetupInicial)
    SHEETS: {
      MASTER_BNCC:     props.getProperty('ID_SHEET_MASTER_BNCC')     || '',
      BANCO_QUESTOES:  props.getProperty('ID_SHEET_BANCO_QUESTOES')  || '',
      TURMAS_ALUNOS:   props.getProperty('ID_SHEET_TURMAS_ALUNOS')   || '',
      RESULTADOS:      props.getProperty('ID_SHEET_RESULTADOS')      || ''
    },

    // IDs das pastas no Drive (gravados pelo SetupInicial)
    DRIVE: {
      ROOT:             props.getProperty('ID_PASTA_ROOT')            || '',
      PLANEJAMENTO:     props.getProperty('ID_PASTA_PLANEJAMENTO')    || '',
      AVALIACAO:        props.getProperty('ID_PASTA_AVALIACAO')       || '',
      RESULTADOS:       props.getProperty('ID_PASTA_RESULTADOS')      || '',
      ALUNOS:           props.getProperty('ID_PASTA_ALUNOS')          || '',
      CONFIGURACOES:    props.getProperty('ID_PASTA_CONFIGURACOES')   || ''
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
      MAX_LINHAS: 10000  // Rotaciona ao atingir este limite
    },

    // Classificação de dados LGPD (Bloco 8.1)
    LGPD: {
      PUBLICO:   'PUBLICO',
      RESTRITO:  'RESTRITO',
      SENSIVEL:  'SENSIVEL',
      // Colunas sensíveis que exigem verificarPermissao(COORDENADOR)
      COLUNAS_SENSIVEIS: [
        'Tipo_NEE', 'Laudo_Medico', 'Situacao_Familiar',
        'Historico_Disciplinar', 'Observacoes_Saude'
      ],
      // Colunas restritas que exigem verificarPermissao(PROFESSOR)
      COLUNAS_RESTRITAS: [
        'Nome_Completo', 'Nota_Individual', 'Frequencia_Individual',
        'Contato_WhatsApp', 'Email_Responsavel', 'Observacoes_Pedagogicas'
      ]
    }
  });
}

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
      'Acesse Apps Script > Propriedades do projeto > Propriedades de script ' +
      'e adicione a propriedade GEMINI_KEY com sua chave da API.'
    );
  }
  return key;
}

/**
 * Salva um ID de planilha-mestre nas propriedades do script.
 * Chamado pelo SetupInicial após criar as planilhas.
 * @param {string} chave - Chave da propriedade (ex: 'ID_SHEET_MASTER_BNCC')
 * @param {string} id - ID da planilha no Google Sheets
 */
function salvarPropriedade(chave, valor) {
  PropertiesService.getScriptProperties().setProperty(chave, valor);
}

/**
 * Retorna o e-mail do usuário ativo na sessão atual.
 * @returns {string} E-mail do usuário
 */
function getUsuarioAtivo() {
  return Session.getActiveUser().getEmail();
}
