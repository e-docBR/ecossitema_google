/**
 * PEDAGOGO.AI — Serviço do Google Sheets
 * Arquivo: 04_SheetsService.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Camada de abstração sobre as 4 planilhas-mestre do sistema.
 * Todos os acessos a planilhas devem passar por este serviço.
 * Centraliza proteções LGPD (cell protection) e validações.
 *
 * Referência: Bloco 1.4, Bloco 8.1 do prompt mestre
 */

// ============================================================
// NOMES DAS ABAS (por planilha)
// ============================================================

const ABAS = Object.freeze({
  MASTER_BNCC: {
    HABILIDADES:  'Habilidades',
    DESCRITORES:  'Descritores_SAEB'
  },
  BANCO_QUESTOES: {
    QUESTOES: 'Questões',
    GABARITOS: 'Gabaritos'
  },
  TURMAS_ALUNOS: {
    MATRICULAS:  'Matrículas',
    FREQUENCIA:  'Frequência',
    TURMAS:      'Turmas'
  },
  RESULTADOS: {
    NOTAS:      'Notas',
    DASHBOARD:  'Dashboard',
    HISTORICO:  'Histórico'
  }
});

// ============================================================
// OPERAÇÕES GENÉRICAS
// ============================================================

/**
 * Lê todos os dados de uma aba de uma planilha.
 *
 * @param {string} spreadsheetId - ID da planilha
 * @param {string} nomAba - Nome da aba
 * @returns {Array[][]} Matriz de dados (inclui linha de cabeçalho)
 */
function lerAba(spreadsheetId, nomAba) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const aba = ss.getSheetByName(nomAba);
    if (!aba) throw new Error(`Aba "${nomAba}" não encontrada`);
    const dados = aba.getDataRange().getValues();
    return dados;
  } catch (e) {
    registrarLog('ERRO', `Erro ao ler aba ${nomAba}: ${e.message}`, spreadsheetId);
    throw e;
  }
}

/**
 * Appenda uma linha ao final de uma aba.
 *
 * @param {string} spreadsheetId - ID da planilha
 * @param {string} nomAba - Nome da aba
 * @param {Array} linha - Dados da linha (valores posicionais)
 */
function escreverLinha(spreadsheetId, nomAba, linha) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const aba = ss.getSheetByName(nomAba);
    if (!aba) throw new Error(`Aba "${nomAba}" não encontrada`);
    aba.appendRow(linha.map(v => sanitizarCelula(v)));
  } catch (e) {
    registrarLog('ERRO', `Erro ao escrever em ${nomAba}: ${e.message}`, spreadsheetId);
    throw e;
  }
}

/**
 * Busca linhas que correspondam a critérios de filtro.
 *
 * @param {string} spreadsheetId - ID da planilha
 * @param {string} nomAba - Nome da aba
 * @param {Object} filtros - Ex: { 2: 'EF06LP05', 3: 'OBJETIVA' } (colIndex: valor)
 * @returns {Array[][]} Linhas que satisfazem TODOS os filtros
 */
function buscarLinhas(spreadsheetId, nomAba, filtros) {
  const dados = lerAba(spreadsheetId, nomAba);
  const cabecalho = dados[0];
  const linhas = dados.slice(1);

  return linhas.filter(linha =>
    Object.entries(filtros).every(([col, valor]) => {
      const idx = parseInt(col, 10);
      return String(linha[idx] || '').trim().toLowerCase() === String(valor).trim().toLowerCase();
    })
  );
}

/**
 * Atualiza campos de uma linha existente encontrada por chave.
 *
 * @param {string} spreadsheetId - ID da planilha
 * @param {string} nomAba - Nome da aba
 * @param {number} colChave - Índice da coluna chave (base 0)
 * @param {string} valorChave - Valor a buscar na coluna chave
 * @param {Object} dadosNovos - Ex: { 5: 'NovoValor', 6: 10 } (colIndex: valor)
 * @returns {boolean} true se encontrou e atualizou
 */
function atualizarLinha(spreadsheetId, nomAba, colChave, valorChave, dadosNovos) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const aba = ss.getSheetByName(nomAba);
    if (!aba) throw new Error(`Aba "${nomAba}" não encontrada`);

    const dados = aba.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
      if (String(dados[i][colChave]).trim() === String(valorChave).trim()) {
        Object.entries(dadosNovos).forEach(([col, valor]) => {
          aba.getRange(i + 1, parseInt(col, 10) + 1).setValue(sanitizarCelula(valor));
        });
        return true;
      }
    }
    return false;
  } catch (e) {
    registrarLog('ERRO', `Erro ao atualizar em ${nomAba}: ${e.message}`);
    throw e;
  }
}

// ============================================================
// PROTEÇÕES LGPD (Bloco 8.1)
// ============================================================

/**
 * Aplica proteção de células nas colunas sensíveis e restritas.
 * Deve ser chamado pelo SetupInicial após criar as planilhas-mestre.
 *
 * @param {string} spreadsheetId - ID da planilha TURMAS_ALUNOS
 * @param {string} nomAba - Nome da aba a proteger
 * @param {number[]} colunas - Índices das colunas a proteger (base 0)
 * @param {string[]} editoresPermitidos - E-mails que podem editar
 */
function protegerColunas(spreadsheetId, nomAba, colunas, editoresPermitidos) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const aba = ss.getSheetByName(nomAba);
    if (!aba) return;

    colunas.forEach(col => {
      const range = aba.getRange(1, col + 1, aba.getMaxRows(), 1);
      const protecao = range.protect();
      protecao.setDescription(`Coluna LGPD-Sensível — acesso restrito`);
      protecao.removeEditors(protecao.getEditors());
      if (editoresPermitidos && editoresPermitidos.length > 0) {
        protecao.addEditors(editoresPermitidos.filter(e => e && e.includes('@')));
      }
    });

    registrarLog('INFO', `Proteção LGPD aplicada em ${nomAba}`, `${colunas.length} colunas protegidas`);
  } catch (e) {
    registrarLog('ERRO', `Falha ao proteger colunas em ${nomAba}: ${e.message}`);
  }
}

// ============================================================
// WRAPPERS ESPECÍFICOS POR PLANILHA
// ============================================================

/**
 * Lê os dados da planilha MASTER_BNCC.
 * @returns {Array[][]} Dados da aba Habilidades
 */
function lerMasterBNCC() {
  return lerAba(getConfig().SHEETS.MASTER_BNCC, ABAS.MASTER_BNCC.HABILIDADES);
}

/**
 * Busca questões no BANCO_QUESTOES com filtros opcionais.
 *
 * @param {Object} filtros - Filtros a aplicar { componente, habilidade, tipo, dificuldade }
 * @returns {Array[][]} Linhas de questões correspondentes
 */
function lerBancoQuestoes(filtros) {
  const config = getConfig();
  const dados = lerAba(config.SHEETS.BANCO_QUESTOES, ABAS.BANCO_QUESTOES.QUESTOES);
  const cabecalho = dados[0];
  const linhas = dados.slice(1);

  if (!filtros) return linhas;

  // Mapear nomes de colunas → índices
  const idx = {};
  cabecalho.forEach((nome, i) => { idx[String(nome).trim()] = i; });

  return linhas.filter(linha => {
    if (filtros.componente && String(linha[idx['Componente']] || '').toLowerCase() !== filtros.componente.toLowerCase()) return false;
    if (filtros.habilidade && String(linha[idx['Habilidade_BNCC']] || '').toUpperCase() !== filtros.habilidade.toUpperCase()) return false;
    if (filtros.tipo      && String(linha[idx['Tipo']] || '').toUpperCase() !== filtros.tipo.toUpperCase()) return false;
    if (filtros.dificuldade && String(linha[idx['Dificuldade']] || '').toUpperCase() !== filtros.dificuldade.toUpperCase()) return false;
    return true;
  });
}

/**
 * Lê dados de turmas e alunos matriculados.
 *
 * @param {string} [turma] - Filtrar por turma (opcional)
 * @returns {Array[][]} Linhas de matrículas
 */
function lerTurmasAlunos(turma) {
  const config = getConfig();
  const dados = lerAba(config.SHEETS.TURMAS_ALUNOS, ABAS.TURMAS_ALUNOS.MATRICULAS);
  if (!turma) return dados.slice(1);

  const idxTurma = 3;  // Coluna "Turma" (índice 3 conforme schema)
  return dados.slice(1).filter(linha =>
    String(linha[idxTurma] || '').toLowerCase() === turma.toLowerCase()
  );
}

/**
 * Registra resultado de avaliação na planilha RESULTADOS.
 *
 * @param {Object} dados - { aluno, turma, prova, nota, acertos, habilidadesCriticas, data }
 */
function escreverResultado(dados) {
  const config = getConfig();
  const linha = [
    dados.data || new Date(),
    dados.aluno,
    dados.turma,
    dados.componente || '',
    dados.prova,
    dados.nota,
    dados.acertos || '',
    dados.totalQuestoes || '',
    (dados.habilidadesCriticas || []).join('; '),
    dados.bimestre || '',
    dados.status || 'REGISTRADO',
    getUsuarioAtivo()
  ];
  escreverLinha(config.SHEETS.RESULTADOS, ABAS.RESULTADOS.NOTAS, linha);
}

/**
 * Lê resultados de avaliação filtrados por turma e componente.
 *
 * @param {string} turma - Identificador da turma
 * @param {string} [componente] - Componente curricular (opcional)
 * @returns {Array[][]} Linhas de resultados
 */
function lerResultados(turma, componente) {
  const config = getConfig();
  const dados = lerAba(config.SHEETS.RESULTADOS, ABAS.RESULTADOS.NOTAS);
  const linhas = dados.slice(1);

  return linhas.filter(linha => {
    const turmaOk = String(linha[2] || '').toLowerCase() === turma.toLowerCase();
    const compOk = !componente || String(linha[3] || '').toLowerCase() === componente.toLowerCase();
    return turmaOk && compOk;
  });
}

// ============================================================
// CRIAÇÃO DE ESTRUTURA DAS PLANILHAS-MESTRE
// ============================================================

/**
 * Cria os cabeçalhos das 4 planilhas-mestre.
 * Chamado pelo SetupInicial.
 *
 * @param {string} spreadsheetId - ID da planilha
 * @param {string} nomePlanilha - 'MASTER_BNCC' | 'BANCO_QUESTOES' | 'TURMAS_ALUNOS' | 'RESULTADOS'
 */
function criarCabecalhosPlanilha(spreadsheetId, nomePlanilha) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const schemas = _obterSchemasPlanilhas();
  const schema = schemas[nomePlanilha];
  if (!schema) return;

  Object.entries(schema).forEach(([nomeAba, cabecalhos]) => {
    let aba = ss.getSheetByName(nomeAba);
    if (!aba) {
      aba = ss.insertSheet(nomeAba);
    }
    // Escrever cabeçalhos apenas se a aba estiver vazia
    if (aba.getLastRow() === 0) {
      const range = aba.getRange(1, 1, 1, cabecalhos.length);
      range.setValues([cabecalhos]);
      range.setFontWeight('bold');
      range.setBackground('#1a73e8');
      range.setFontColor('#ffffff');
      aba.setFrozenRows(1);
    }
  });
}

/**
 * Define os schemas (cabeçalhos) de todas as planilhas-mestre.
 * @returns {Object} Schemas por planilha
 */
function _obterSchemasPlanilhas() {
  return {
    MASTER_BNCC: {
      'Habilidades': [
        'Codigo_BNCC', 'Componente', 'Ano_Serie', 'Campo_Tematico',
        'Descricao_Habilidade', 'Nivel_Bloom', 'Ativo'
      ],
      'Descritores_SAEB': [
        'Codigo_BNCC', 'Descritor_SAEB', 'Codigo_Descritor', 'Prova_Referencia'
      ]
    },
    BANCO_QUESTOES: {
      'Questões': [
        'ID_Questao', 'Tipo', 'Componente', 'Ano_Serie', 'Habilidade_BNCC',
        'Nivel_Bloom', 'Dificuldade', 'Enunciado', 'Alternativas_JSON',
        'Gabarito', 'Rubrica', 'Autor', 'Data_Criacao', 'Ativo',
        'Requer_Imagem', 'Fonte_SAEB'
      ],
      'Gabaritos': [
        'ID_Prova', 'Titulo', 'Turma', 'Componente', 'Bimestre',
        'Data_Aplicacao', 'Questoes_IDs', 'Total_Objetivas', 'Total_Discursivas',
        'Peso_Objetivo', 'Peso_Discursivo', 'Nota_Maxima'
      ]
    },
    TURMAS_ALUNOS: {
      'Matrículas': [
        'ID_Matricula', 'Nome_Completo', 'Data_Nascimento', 'Turma',
        'Turno', 'Segmento', 'Responsavel', 'Contato_WhatsApp',
        'Email_Responsavel', 'Possui_NEE', 'Tipo_NEE', 'Laudo_Medico',
        'Requer_PEI', 'Observacoes_Pedagogicas', 'Status',
        'Faixa_Etaria_EJA', 'Escolaridade_Anterior_EJA',
        'Motivacao_Retorno_EJA', 'Turno_Trabalho_EJA'
      ],
      'Frequência': [
        'Data', 'Turma', 'Componente', 'Professor', 'Total_Aulas',
        'ID_Matricula', 'Nome_Aluno', 'Presenca', 'Observacao'
      ],
      'Turmas': [
        'Codigo_Turma', 'Nome_Turma', 'Segmento', 'Turno',
        'Professor_Titular', 'Total_Alunos', 'Ano_Letivo', 'Ativa'
      ]
    },
    RESULTADOS: {
      'Notas': [
        'Data_Registro', 'Nome_Aluno', 'Turma', 'Componente',
        'Titulo_Prova', 'Nota_Final', 'Acertos', 'Total_Questoes',
        'Habilidades_Criticas', 'Bimestre', 'Status', 'Registrado_Por'
      ],
      'Dashboard': [
        'Turma', 'Componente', 'Bimestre', 'Media_Turma',
        'Perc_Aprovados', 'Perc_Insuficientes', 'Taxa_Participacao',
        'Habilidades_Consolidadas', 'Habilidades_Criticas', 'Data_Atualizacao'
      ],
      'Histórico': [
        'ID_Aluno', 'Turma', 'Componente', 'Bimestre_1', 'Bimestre_2',
        'Bimestre_3', 'Bimestre_4', 'Media_Anual', 'Resultado_Final',
        'Ano_Letivo'
      ]
    }
  };
}
