/**
 * PEDAGOGO.AI — Utilitários Compartilhados
 * Arquivo: 01_Utils.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Sprint 2 — BUG-06: registrarLog otimizado (sem leitura de getConfig() por chamada)
 * Sprint 4 — CRÍTICO-04: validarCodigoBNCC agora suporta EI, EF, EM e CM
 */

// ============================================================
// CACHE DE LOG (Sprint 2 — BUG-06)
// ============================================================

/** ID da pasta de configurações cacheado em memória durante a execução */
let _logPastaId  = undefined;   // undefined = ainda não buscado; null = não existe
let _logArquivo  = 'Logs_Sistema.txt';
let _logMaxBytes = 400000;

// ============================================================
// LOGGING E AUDITORIA
// ============================================================

/**
 * Registra uma entrada no arquivo de log do sistema (Logs_Sistema.txt).
 * Otimizado: lê o ID da pasta apenas uma vez por execução (BUG-06 / CRÍTICO-03).
 *
 * @param {string} nivel     - 'INFO' | 'ALERTA' | 'ERRO' | 'AUDITORIA'
 * @param {string} mensagem  - Descrição do evento
 * @param {string} [contexto] - Dados adicionais de contexto
 */
function registrarLog(nivel, mensagem, contexto) {
  try {
    const timestamp = Utilities.formatDate(new Date(), 'America/Bahia', 'dd/MM/yyyy HH:mm:ss');
    let usuario = '';
    try { usuario = Session.getActiveUser().getEmail(); } catch (_) {}
    const linha = `[${timestamp}] [${nivel}] [${usuario}] ${mensagem}${contexto ? ' | ' + contexto : ''}\n`;

    // Console sempre (Stackdriver / Apps Script IDE)
    if (nivel === 'ERRO')    console.error(linha.trim());
    else if (nivel === 'ALERTA') console.warn(linha.trim());
    else                         console.log(linha.trim());

    // ID da pasta: ler PropertiesService apenas 1x por execução
    if (_logPastaId === undefined) {
      _logPastaId = PropertiesService.getScriptProperties().getProperty('ID_PASTA_CONFIGURACOES') || null;
    }
    if (!_logPastaId) return;  // Setup ainda não concluído

    _escreverLogNoDrive(linha, _logPastaId);
  } catch (e) {
    console.error('Falha ao registrar log: ' + e.message);
  }
}

/**
 * Escreve uma linha no arquivo de log no Drive.
 * Faz rotação automática quando o arquivo supera _logMaxBytes.
 * @private
 */
function _escreverLogNoDrive(linha, pastaId) {
  try {
    const pasta = DriveApp.getFolderById(pastaId);
    const iter = pasta.getFilesByName(_logArquivo);

    if (iter.hasNext()) {
      const arquivo = iter.next();
      if (arquivo.getSize() > _logMaxBytes) {
        // Rotação: manter apenas a segunda metade do arquivo
        const conteudo = arquivo.getBlob().getDataAsString();
        const linhas = conteudo.split('\n');
        const novoConteudo = linhas.slice(Math.floor(linhas.length / 2)).join('\n') + linha;
        arquivo.setContent(novoConteudo);
      } else {
        arquivo.setContent(arquivo.getBlob().getDataAsString() + linha);
      }
    } else {
      pasta.createFile(_logArquivo, linha, MimeType.PLAIN_TEXT);
    }
  } catch (e) {
    console.error('_escreverLogNoDrive falhou: ' + e.message);
  }
}

/**
 * Registra uma ação na trilha de auditoria (LGPD Art. 37).
 *
 * @param {string} acao    - 'LEITURA' | 'ESCRITA' | 'EXPORTACAO' | 'EXCLUSAO'
 * @param {string} recurso - Ex: 'TURMAS_ALUNOS.Tipo_NEE'
 * @param {string} [contexto]
 */
function registrarAuditoria(acao, recurso, contexto) {
  const email = getUsuarioAtivo();
  registrarLog(
    'AUDITORIA',
    `[${acao}] Recurso: ${recurso} | Usuário: ${email}`,
    contexto || ''
  );
}

// ============================================================
// FORMATAÇÃO DE DATAS
// ============================================================

/**
 * Formata uma data usando o fuso horário de Mucuri-BA (America/Bahia).
 * @param {Date} data
 * @param {string} [formato='dd/MM/yyyy']
 * @returns {string}
 */
function formatarData(data, formato) {
  return Utilities.formatDate(data, 'America/Bahia', formato || 'dd/MM/yyyy');
}

/**
 * Retorna a data atual no padrão brasileiro.
 * @returns {string}
 */
function dataHoje() {
  return formatarData(new Date(), 'dd/MM/yyyy');
}

/**
 * Retorna timestamp atual para nomes de arquivo.
 * @returns {string} yyyyMMdd_HHmmss
 */
function timestampArquivo() {
  return formatarData(new Date(), 'yyyyMMdd_HHmmss');
}

// ============================================================
// VALIDAÇÃO DE CÓDIGOS BNCC (Sprint 4 — CRÍTICO-04)
// ============================================================

/**
 * Componentes curriculares válidos da BNCC — Ensino Fundamental.
 */
const COMPONENTES_BNCC_EF = Object.freeze({
  LP: 'Língua Portuguesa', MA: 'Matemática',   CI: 'Ciências',
  HI: 'História',          GE: 'Geografia',    AR: 'Arte',
  EF: 'Educação Física',   ER: 'Ensino Religioso', LI: 'Língua Inglesa',
  CH: 'Ciências Humanas',  CN: 'Ciências da Natureza'
});

/**
 * Componentes válidos para Ensino Médio (BNCC 2018).
 */
const COMPONENTES_BNCC_EM = Object.freeze({
  CNT: 'Ciências da Natureza e suas Tecnologias',
  MAT: 'Matemática e suas Tecnologias',
  LGG: 'Linguagens e suas Tecnologias',
  CHS: 'Ciências Humanas e Sociais Aplicadas'
});

/**
 * Campos de experiência válidos para Educação Infantil.
 */
const CAMPOS_BNCC_EI = Object.freeze({
  ET: 'O eu, o outro e o nós',
  CG: 'Corpo, gestos e movimentos',
  TS: 'Traços, sons, cores e formas',
  EO: 'Escuta, fala, pensamento e imaginação',
  EF_EI: 'Espaços, tempos, quantidades, relações e transformações'
});

/**
 * Valida um código BNCC para qualquer segmento (EI, EF, EM) ou currículo municipal (CM).
 * Substitui a função anterior que só aceitava EF.
 *
 * Formatos aceitos:
 *  - EI + 2 dígitos + 2 letras + 2 dígitos  → Educação Infantil  (ex: EI01ET01)
 *  - EF + 2 dígitos + 2 letras + 2 dígitos  → Ensino Fundamental (ex: EF06LP05)
 *  - EM + 2 dígitos + 2-3 letras + 2-3 díg  → Ensino Médio       (ex: EM13CNT201)
 *  - CM + 2 dígitos + 2 letras + 2 dígitos  → Currículo Municipal (ex: CM06LP01)
 *
 * @param {string} codigo - Código a validar
 * @returns {boolean}
 */
function validarCodigoBNCC(codigo) {
  if (!codigo || typeof codigo !== 'string') return false;
  const c = codigo.trim().toUpperCase();

  // Educação Infantil
  if (/^EI\d{2}[A-Z]{2}\d{2}$/.test(c)) return true;

  // Ensino Médio (código extendido: EM13CNT201)
  if (/^EM\d{2}[A-Z]{2,3}\d{2,3}$/.test(c)) return true;

  // Currículo Municipal complementar
  if (/^CM\d{2}[A-Z]{2}\d{2}$/.test(c)) return true;

  // Ensino Fundamental
  if (!/^EF\d{2}[A-Z]{2}\d{2}$/.test(c)) return false;

  // Verificar componente curricular válido
  const componente = c.substring(4, 6);
  if (!COMPONENTES_BNCC_EF[componente]) return false;

  // Verificar ano: simples (01-09) OU range inter-anos válido (ex: 69, 15, 89)
  const anoStr = c.substring(2, 4);
  const anoNum = parseInt(anoStr, 10);
  const anoSimples = anoNum >= 1 && anoNum <= 9;
  const d1 = parseInt(anoStr[0], 10), d2 = parseInt(anoStr[1], 10);
  const anoRange = d1 >= 1 && d2 >= 1 && d1 < d2;
  return anoSimples || anoRange;
}

/**
 * Retorna o segmento ao qual pertence um código BNCC.
 * @param {string} codigo
 * @returns {'EI'|'EF'|'EM'|'CM'|null}
 */
function segmentoBNCC(codigo) {
  if (!codigo) return null;
  const c = codigo.trim().toUpperCase();
  if (c.startsWith('EI')) return 'EI';
  if (c.startsWith('EF')) return 'EF';
  if (c.startsWith('EM')) return 'EM';
  if (c.startsWith('CM')) return 'CM';
  return null;
}

/**
 * Extrai todos os códigos BNCC de uma string de texto.
 * Suporta EI, EF, EM e CM.
 *
 * @param {string} texto - Texto a analisar
 * @returns {string[]} Códigos únicos encontrados
 */
function extrairCodigosBNCC(texto) {
  if (!texto) return [];
  // Regex ampla para capturar todos os formatos
  const matches = texto.match(/(?:EI|EF|EM|CM)\d{2}[A-Z]{2,3}\d{2,3}/g);
  return matches ? [...new Set(matches)] : [];
}

// ============================================================
// GERAÇÃO DE IDs
// ============================================================

/**
 * Gera ID único para questões: COMP-EFYY-TIPO-NNNN
 * Ex: LP-EF06-OBJ-0042
 */
function gerarIDQuestao(componente, codigoHabilidade, tipo, sequencia) {
  const prefixo = codigoHabilidade ? codigoHabilidade.substring(0, 2) : 'EF';
  const ano = codigoHabilidade ? codigoHabilidade.substring(2, 4) : '00';
  const seq = String(sequencia).padStart(4, '0');
  return `${componente}-${prefixo}${ano}-${tipo}-${seq}`;
}

/**
 * Gera ID único para matrículas: MAT-YYYY-NNNNNN
 */
function gerarIDMatricula(sequencia) {
  const ano = formatarData(new Date(), 'yyyy');
  const seq = String(sequencia).padStart(6, '0');
  return `MAT-${ano}-${seq}`;
}

/**
 * Gera slug de e-mail seguro para uso em nomes de pasta.
 * Ex: "prof.maria@escola.edu.br" → "prof_maria_escola_edu_br"
 * @param {string} email
 * @returns {string}
 */
function emailParaSlug(email) {
  return String(email || '').toLowerCase()
    .replace(/@/g, '_').replace(/\./g, '_')
    .replace(/[^a-z0-9_]/g, '').substring(0, 40);
}

// ============================================================
// PROTEÇÃO DE DADOS LGPD
// ============================================================

/**
 * Anonimiza um nome completo para relatórios públicos.
 * Para turmas com menos de 10 alunos, usa "Aluno X" para proteção adicional.
 *
 * @param {string} nomeCompleto
 * @param {number} [indice] - Índice sequencial para turmas pequenas
 * @returns {string}
 */
function anonimizarNome(nomeCompleto, indice) {
  if (!nomeCompleto) return '—';
  if (indice !== undefined) return `Aluno ${indice + 1}`;
  const partes = nomeCompleto.trim().split(/\s+/);
  return partes.map(p => p.charAt(0).toUpperCase() + '.').join('');
}

/**
 * Anonimiza um endereço de e-mail.
 * Ex: "joao.silva@email.com" → "j***@email.com"
 */
function anonimizarEmail(email) {
  if (!email || !email.includes('@')) return '—';
  const [usuario, dominio] = email.split('@');
  return usuario.charAt(0) + '***@' + dominio;
}

/**
 * Classifica um campo conforme a LGPD.
 * @param {string} nomeCampo
 * @returns {'PUBLICO'|'RESTRITO'|'SENSIVEL'}
 */
function classificarDado(nomeCampo) {
  const config = getConfig();
  const campo = nomeCampo.toLowerCase();
  const sensiveis = config.LGPD.COLUNAS_SENSIVEIS.map(c => c.toLowerCase());
  const restritos = config.LGPD.COLUNAS_RESTRITAS.map(c => c.toLowerCase());
  if (sensiveis.some(s => campo.includes(s))) return config.LGPD.SENSIVEL;
  if (restritos.some(r => campo.includes(r))) return config.LGPD.RESTRITO;
  return config.LGPD.PUBLICO;
}

// ============================================================
// COMUNICAÇÃO (E-MAIL)
// ============================================================

/**
 * Envia e-mail de alerta para destinatários do sistema.
 * Loga aviso se nenhum destinatário válido for encontrado.
 *
 * @param {string|string[]} destinatarios
 * @param {string} assunto
 * @param {string} corpo - HTML
 */
function enviarEmailAlerta(destinatarios, assunto, corpo) {
  try {
    const destArray = Array.isArray(destinatarios) ? destinatarios : [destinatarios];
    const destFiltrado = destArray.filter(e => e && typeof e === 'string' && e.includes('@'));

    if (destFiltrado.length === 0) {
      registrarLog('ALERTA',
        'E-mail não enviado — nenhum destinatário válido configurado.',
        `Assunto: ${assunto}. Configure EMAIL_COORDENACAO e EMAIL_DIRECAO no sistema.`
      );
      return;
    }

    MailApp.sendEmail({
      to: destFiltrado.join(','),
      subject: `[PEDAGOGO.AI] ${assunto}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 8px;">
            PEDAGOGO.AI — Colégio Municipal de Itabatan
          </h2>
          ${corpo}
          <hr style="margin-top: 24px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Mensagem automática do sistema PEDAGOGO.AI | SEME/Mucuri-BA<br>
            Enviada em: ${formatarData(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
      `
    });

    registrarLog('INFO', `E-mail enviado para: ${destFiltrado.join(', ')}`, assunto);
  } catch (e) {
    registrarLog('ERRO', 'Falha ao enviar e-mail: ' + e.message, assunto);
  }
}

// ============================================================
// UTILITÁRIOS GERAIS
// ============================================================

/**
 * Converte valor de nota para faixa descritiva.
 */
function classificarNota(nota) {
  const config = getConfig();
  const faixas = config.PEDAGOGICO.FAIXAS_NOTAS;
  if (nota >= faixas.AVANCADO.min)    return 'Avançado';
  if (nota >= faixas.ADEQUADO.min)    return 'Adequado';
  if (nota >= faixas.BASICO.min)      return 'Básico';
  return 'Insuficiente';
}

/**
 * Classifica percentual de acertos por habilidade BNCC com semáforo.
 * @param {number} percentual - De 0 a 1
 * @returns {{status: string, emoji: string}}
 */
function classificarDesempenhoHabilidade(percentual) {
  if (percentual >= 0.70) return { status: 'Consolidada',        emoji: '🟢' };
  if (percentual >= 0.40) return { status: 'Em Desenvolvimento', emoji: '🟡' };
  return                       { status: 'Crítica',              emoji: '🔴' };
}

/**
 * Formata um percentual como string brasileira.
 * @param {number} valor - De 0 a 1
 * @returns {string} Ex: "72,5%"
 */
function formatarPercentual(valor) {
  return (valor * 100).toFixed(1).replace('.', ',') + '%';
}

/**
 * Sanitiza texto para evitar injeção em fórmulas do Sheets.
 * @param {string} texto
 * @returns {string}
 */
function sanitizarCelula(texto) {
  if (!texto) return '';
  const t = String(texto).trim();
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

/**
 * Retorna emoji de semáforo baseado no status.
 * @param {string} status - 'OK' | 'ATENCAO' | 'CRITICO'
 * @returns {string}
 */
function semaforoEmoji(status) {
  const mapa = { OK: '🟢', ATENCAO: '🟡', CRITICO: '🔴' };
  return mapa[status] || '⚪';
}

/**
 * Normaliza string para comparação (remove acentos, lowercase, trim).
 * Usado para buscas e comparações de nomes.
 * @param {string} str
 * @returns {string}
 */
function normalizar(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifica se uma string representa "ativo/true" de forma tolerante.
 * Aceita: 'TRUE', 'true', 'True', 'Ativo', 'ativo', 'S', 'Sim', 'sim'.
 * @param {*} valor
 * @returns {boolean}
 */
function estaAtivo(valor) {
  const v = String(valor || '').trim().toUpperCase();
  return v === 'TRUE' || v === 'ATIVO' || v === 'S' || v === 'SIM';
}
