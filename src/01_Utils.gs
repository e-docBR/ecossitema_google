/**
 * PEDAGOGO.AI — Utilitários Compartilhados
 * Arquivo: 01_Utils.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Funções auxiliares usadas por todos os módulos do sistema.
 * Sem dependências externas — apenas APIs nativas do Apps Script.
 *
 * Referência: Blocos 1, 5 e 8 do prompt mestre
 */

// ============================================================
// LOGGING E AUDITORIA
// ============================================================

/**
 * Registra uma entrada no arquivo de log do sistema (Logs_Sistema.txt).
 * Formato: [DATA HORA] [NÍVEL] mensagem | contexto
 *
 * @param {string} nivel - 'INFO' | 'ALERTA' | 'ERRO' | 'AUDITORIA'
 * @param {string} mensagem - Descrição do evento
 * @param {string} [contexto=''] - Dados adicionais de contexto
 */
function registrarLog(nivel, mensagem, contexto) {
  try {
    const config = getConfig();
    const timestamp = formatarData(new Date(), 'dd/MM/yyyy HH:mm:ss');
    const usuario = getUsuarioAtivo();
    const linha = `[${timestamp}] [${nivel}] [${usuario}] ${mensagem}${contexto ? ' | ' + contexto : ''}\n`;

    // Tentar escrever no arquivo de log no Drive
    const pastaConfigId = config.DRIVE.CONFIGURACOES;
    if (pastaConfigId) {
      const pasta = DriveApp.getFolderById(pastaConfigId);
      const arquivos = pasta.getFilesByName(config.LOG.ARQUIVO);
      let arquivo;
      if (arquivos.hasNext()) {
        arquivo = arquivos.next();
        const conteudoAtual = arquivo.getBlob().getDataAsString();
        const linhas = conteudoAtual.split('\n');
        if (linhas.length > config.LOG.MAX_LINHAS) {
          // Rotacionar: manter apenas metade das linhas mais recentes
          const novoConteudo = linhas.slice(Math.floor(config.LOG.MAX_LINHAS / 2)).join('\n');
          arquivo.setContent(novoConteudo + linha);
        } else {
          arquivo.setContent(conteudoAtual + linha);
        }
      } else {
        pasta.createFile(config.LOG.ARQUIVO, linha, MimeType.PLAIN_TEXT);
      }
    }

    // Também registrar no console do Apps Script (visível no Stackdriver)
    if (nivel === 'ERRO') {
      console.error(linha.trim());
    } else if (nivel === 'ALERTA') {
      console.warn(linha.trim());
    } else {
      console.log(linha.trim());
    }
  } catch (e) {
    // Não propagar erros de logging — apenas registrar no console
    console.error('Falha ao registrar log: ' + e.message);
  }
}

// ============================================================
// FORMATAÇÃO DE DATAS
// ============================================================

/**
 * Formata uma data usando o fuso horário de Mucuri-BA (America/Bahia).
 * SEMPRE use esta função para formatação de datas — nunca use Date.toString() diretamente.
 *
 * @param {Date} data - Objeto Date a formatar
 * @param {string} [formato='dd/MM/yyyy'] - Formato de saída (padrão Java SimpleDateFormat)
 * @returns {string} Data formatada
 */
function formatarData(data, formato) {
  const fmt = formato || 'dd/MM/yyyy';
  return Utilities.formatDate(data, 'America/Bahia', fmt);
}

/**
 * Retorna a data atual formatada no padrão brasileiro.
 * @returns {string} Data atual no formato dd/MM/yyyy
 */
function dataHoje() {
  return formatarData(new Date(), 'dd/MM/yyyy');
}

/**
 * Retorna timestamp atual completo para nomes de arquivo.
 * @returns {string} Timestamp no formato yyyyMMdd_HHmmss
 */
function timestampArquivo() {
  return formatarData(new Date(), 'yyyyMMdd_HHmmss');
}

// ============================================================
// VALIDAÇÃO DE CÓDIGOS BNCC
// ============================================================

/**
 * Componentes curriculares válidos da BNCC (siglas oficiais).
 */
const COMPONENTES_BNCC = Object.freeze({
  LP: 'Língua Portuguesa',
  MA: 'Matemática',
  CI: 'Ciências',
  HI: 'História',
  GE: 'Geografia',
  AR: 'Arte',
  EF: 'Educação Física',
  ER: 'Ensino Religioso',
  LI: 'Língua Inglesa',
  CH: 'Ciências Humanas',  // EJA integrado
  CN: 'Ciências da Natureza'  // EJA integrado
});

/**
 * Valida se uma string é um código de habilidade BNCC bem formatado.
 * Formato esperado: EF + 2 dígitos do ano + 2 letras do componente + 2 dígitos de sequência
 * Exemplo válido: EF06LP05
 *
 * @param {string} codigo - Código a validar
 * @returns {boolean} true se o formato for válido
 */
function validarCodigoBNCC(codigo) {
  if (!codigo || typeof codigo !== 'string') return false;
  const regex = /^EF\d{2}[A-Z]{2}\d{2}$/;
  if (!regex.test(codigo)) return false;

  // Verificar se o componente é válido
  const componente = codigo.substring(4, 6);
  if (!COMPONENTES_BNCC[componente]) return false;

  // Aceitar ano simples (01–09) OU range inter-anos válido da BNCC (ex: 15, 35, 67, 69, 89)
  // Range: primeiro dígito menor que o segundo (ambos entre 1–9)
  const anoStr = codigo.substring(2, 4);
  const anoNum = parseInt(anoStr, 10);
  const anoSimples = anoNum >= 1 && anoNum <= 9;                           // 01–09
  const d1 = parseInt(anoStr[0], 10), d2 = parseInt(anoStr[1], 10);
  const anoRange = d1 >= 1 && d2 >= 1 && d1 < d2;                         // ex: 69, 15, 89
  if (!anoSimples && !anoRange) return false;

  return true;
}

/**
 * Extrai todos os códigos BNCC de uma string de texto.
 * Útil para auditar prompts e documentos gerados.
 *
 * @param {string} texto - Texto a analisar
 * @returns {string[]} Array de códigos BNCC encontrados
 */
function extrairCodigosBNCC(texto) {
  if (!texto) return [];
  const matches = texto.match(/EF\d{2}[A-Z]{2}\d{2}/g);
  return matches ? [...new Set(matches)] : [];  // Remove duplicatas
}

// ============================================================
// GERAÇÃO DE IDs
// ============================================================

/**
 * Gera um ID único para questões no formato: COMP-EFYY-TIPO-NNNN
 * Exemplo: LP-EF06-OBJ-0042
 *
 * @param {string} componente - Sigla do componente (ex: 'LP')
 * @param {string} codigoHabilidade - Código BNCC (ex: 'EF06LP05')
 * @param {string} tipo - 'OBJ' | 'DIS' | 'MIST'
 * @param {number} sequencia - Número sequencial
 * @returns {string} ID formatado
 */
function gerarIDQuestao(componente, codigoHabilidade, tipo, sequencia) {
  const ano = codigoHabilidade ? codigoHabilidade.substring(2, 4) : '00';
  const seq = String(sequencia).padStart(4, '0');
  return `${componente}-EF${ano}-${tipo}-${seq}`;
}

/**
 * Gera um ID único para matrículas de alunos.
 * Formato: MAT-YYYY-NNNNNN
 *
 * @param {number} sequencia - Número sequencial da matrícula
 * @returns {string} ID de matrícula
 */
function gerarIDMatricula(sequencia) {
  const ano = formatarData(new Date(), 'yyyy');
  const seq = String(sequencia).padStart(6, '0');
  return `MAT-${ano}-${seq}`;
}

// ============================================================
// PROTEÇÃO DE DADOS LGPD
// ============================================================

/**
 * Anonimiza um nome completo para relatórios públicos.
 * Ex: "João da Silva Santos" → "J.S.S."
 *
 * @param {string} nomeCompleto - Nome completo do aluno
 * @returns {string} Iniciais anonimizadas
 */
function anonimizarNome(nomeCompleto) {
  if (!nomeCompleto) return '—';
  const partes = nomeCompleto.trim().split(/\s+/);
  return partes.map(p => p.charAt(0).toUpperCase() + '.').join('');
}

/**
 * Anonimiza um endereço de e-mail.
 * Ex: "joao.silva@email.com" → "j***@email.com"
 *
 * @param {string} email - E-mail a anonimizar
 * @returns {string} E-mail parcialmente mascarado
 */
function anonimizarEmail(email) {
  if (!email || !email.includes('@')) return '—';
  const [usuario, dominio] = email.split('@');
  return usuario.charAt(0) + '***@' + dominio;
}

// ============================================================
// COMUNICAÇÃO (E-MAIL)
// ============================================================

/**
 * Envia e-mail de alerta para destinatários do sistema.
 * Usado para alertas de frequência, erros críticos, etc.
 *
 * @param {string|string[]} destinatarios - E-mail(s) de destino
 * @param {string} assunto - Assunto do e-mail
 * @param {string} corpo - Corpo do e-mail em HTML
 */
function enviarEmailAlerta(destinatarios, assunto, corpo) {
  try {
    const destArray = Array.isArray(destinatarios) ? destinatarios : [destinatarios];
    const destFiltrado = destArray.filter(e => e && e.includes('@'));

    if (destFiltrado.length === 0) {
      registrarLog('ALERTA', 'Tentativa de envio de e-mail sem destinatários válidos', assunto);
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
 * @param {number} nota - Nota de 0 a 10
 * @returns {string} Faixa de desempenho
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
 * Classifica percentual de acertos por habilidade BNCC.
 * @param {number} percentual - De 0 a 1 (ex: 0.72 = 72%)
 * @returns {Object} {status: string, emoji: string}
 */
function classificarDesempenhoHabilidade(percentual) {
  if (percentual >= 0.70) return { status: 'Consolidada',      emoji: '🟢' };
  if (percentual >= 0.40) return { status: 'Em Desenvolvimento', emoji: '🟡' };
  return                       { status: 'Crítica',            emoji: '🔴' };
}

/**
 * Formata um percentual como string brasileira.
 * @param {number} valor - Valor de 0 a 1
 * @returns {string} Ex: "72,5%"
 */
function formatarPercentual(valor) {
  return (valor * 100).toFixed(1).replace('.', ',') + '%';
}

/**
 * Sanitiza texto para evitar injeção em fórmulas do Sheets.
 * Textos que começam com =, +, -, @ são prefixados com apóstrofo.
 * @param {string} texto - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizarCelula(texto) {
  if (!texto) return '';
  const t = String(texto).trim();
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

/**
 * Retorna emoji de semáforo baseado no status.
 * @param {string} status - 'OK' | 'ATENCAO' | 'CRITICO'
 * @returns {string} Emoji correspondente
 */
function semaforoEmoji(status) {
  const mapa = { OK: '🟢', ATENCAO: '🟡', CRITICO: '🔴' };
  return mapa[status] || '⚪';
}
