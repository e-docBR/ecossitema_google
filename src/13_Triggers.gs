/**
 * PEDAGOGO.AI — Gerenciamento de Triggers
 * Arquivo: 13_Triggers.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Instala, lista e gerencia todos os triggers automáticos do sistema.
 * Execute instalarTriggers() UMA VEZ após o setup inicial.
 *
 * Referência: Bloco 8.2 etapa 5 do prompt mestre
 */

// ============================================================
// INSTALAÇÃO DE TRIGGERS
// ============================================================

/**
 * Instala todos os triggers necessários para o funcionamento automático.
 * Idempotente: verifica duplicatas antes de instalar.
 *
 * Triggers instalados:
 * - Weekly: Backup automático (toda segunda-feira, 2h da manhã)
 * - Weekly: Diagnóstico do sistema (toda segunda-feira, 3h da manhã)
 * - Weekly: Desativar formulários expirados (toda sexta-feira)
 *
 * Nota: Triggers onFormSubmit devem ser adicionados manualmente via
 * Apps Script > Triggers (eles precisam do ID específico de cada Form).
 */
function instalarTriggers() {
  removerTriggersDuplicados();

  const triggersInstalados = [];

  // Backup semanal — toda segunda-feira às 2h da manhã (Bahia = UTC-3)
  const backupTrigger = ScriptApp.newTrigger('executarBackupSemanal')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(2)
    .create();
  triggersInstalados.push('executarBackupSemanal (seg 2h)');

  // Diagnóstico semanal — toda segunda-feira às 3h da manhã
  const diagTrigger = ScriptApp.newTrigger('diagnosticarSistema')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(3)
    .create();
  triggersInstalados.push('diagnosticarSistema (seg 3h)');

  // Verificação de frequência crítica — toda sexta-feira às 7h
  // (para alertar coordenação antes do fim da semana)
  const freqTrigger = ScriptApp.newTrigger('verificarFrequenciaSemanalTodas')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(7)
    .create();
  triggersInstalados.push('verificarFrequenciaSemanalTodas (sex 7h)');

  const config = getConfig();
  salvarPropriedade('TRIGGERS_INSTALADOS', formatarData(new Date(), 'dd/MM/yyyy HH:mm'));
  registrarLog('INFO', `Triggers instalados: ${triggersInstalados.join(', ')}`);

  return triggersInstalados;
}

/**
 * Instala o trigger onFormSubmit para um formulário específico.
 * Deve ser chamado separadamente para cada formulário do sistema.
 *
 * @param {string} spreadsheetId  - ID da planilha vinculada ao Form
 * @param {string} nomeFuncao     - Nome da função handler (ex: 'processarSubmissaoFormularioPlano')
 */
function instalarTriggerForm(spreadsheetId, nomeFuncao) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  ScriptApp.newTrigger(nomeFuncao)
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  registrarLog('INFO', `Trigger onFormSubmit instalado: ${nomeFuncao}`, `Planilha: ${spreadsheetId}`);
}

/**
 * Instala o trigger onOpen vinculado à planilha host do PEDAGOGO.AI.
 * Garante idempotência: remove o trigger antigo antes de instalar o novo.
 *
 * @param {string} spreadsheetId - ID da planilha host (retornada por criarPlanilhaHost)
 */
function instalarTriggerOnOpen(spreadsheetId) {
  // Remover triggers onOpen existentes para esta planilha (evitar duplicatas)
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onOpen' &&
        t.getTriggerSource() === ScriptApp.TriggerSource.SPREADSHEETS) {
      ScriptApp.deleteTrigger(t);
    }
  });

  const ss = SpreadsheetApp.openById(spreadsheetId);
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(ss)
    .onOpen()
    .create();

  registrarLog('INFO', 'Trigger onOpen instalado para planilha host', spreadsheetId);
}

/**
 * Remove triggers duplicados (mesma função instalada mais de uma vez).
 */
function removerTriggersDuplicados() {
  const triggers = ScriptApp.getProjectTriggers();
  const vistas = {};
  let removidos = 0;

  triggers.forEach(trigger => {
    const chave = `${trigger.getHandlerFunction()}_${trigger.getEventType()}`;
    if (vistas[chave]) {
      ScriptApp.deleteTrigger(trigger);
      removidos++;
    } else {
      vistas[chave] = true;
    }
  });

  if (removidos > 0) {
    registrarLog('INFO', `${removidos} trigger(s) duplicado(s) removido(s)`);
  }
}

/**
 * Lista todos os triggers ativos do projeto.
 * @returns {Array} Lista de triggers com informações
 */
function listarTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  return triggers.map(t => ({
    id:       t.getUniqueId(),
    funcao:   t.getHandlerFunction(),
    tipo:     t.getEventType(),
    fonte:    t.getTriggerSource()
  }));
}

/**
 * Remove TODOS os triggers (usar com cuidado em ambiente de produção).
 * @param {string} confirmacao - Deve ser 'CONFIRMAR_REMOCAO_TRIGGERS'
 */
function removerTodosTriggers(confirmacao) {
  if (confirmacao !== 'CONFIRMAR_REMOCAO_TRIGGERS') {
    throw new Error('Confirmação necessária. Passe "CONFIRMAR_REMOCAO_TRIGGERS" como argumento.');
  }
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  registrarLog('ALERTA', `${triggers.length} trigger(s) removido(s) manualmente`);
}

// ============================================================
// HANDLERS DOS TRIGGERS TIME-BASED
// ============================================================

/**
 * Verifica frequência crítica de TODAS as turmas ativas.
 * Executado toda sexta-feira às 7h.
 */
function verificarFrequenciaSemanalTodas() {
  try {
    const config = getConfig();
    if (!config.SHEETS.TURMAS_ALUNOS) return;

    const dados = lerAba(config.SHEETS.TURMAS_ALUNOS, 'Turmas');
    const turmasAtivas = dados.slice(1)
      .filter(t => String(t[7]).toLowerCase() === 'true' || String(t[7]) === 'TRUE')
      .map(t => String(t[0]));  // Código da turma

    turmasAtivas.forEach(turma => {
      try {
        verificarLimiteFaltas(turma);
      } catch (e) {
        registrarLog('ALERTA', `Erro ao verificar frequência de ${turma}: ${e.message}`);
      }
    });

    registrarLog('INFO', `Verificação semanal de frequência: ${turmasAtivas.length} turmas verificadas`);
  } catch (e) {
    registrarLog('ERRO', 'Falha na verificação semanal de frequência: ' + e.message);
  }
}
