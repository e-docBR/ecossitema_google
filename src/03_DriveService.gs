/**
 * PEDAGOGO.AI — Serviço do Google Drive
 * Arquivo: 03_DriveService.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Gerencia a estrutura de pastas e arquivos no Google Drive.
 * Todas as operações de criação/leitura de arquivos passam por aqui.
 * NUNCA use DriveApp diretamente em outros módulos — use as funções deste serviço.
 *
 * Sprint 1 — BUG-04: Substituído addFile/removeFile por moveTo (Drive API v3)
 * Sprint 3 — Nova estrutura: 06_PROFESSORES/{slug_professor}/
 */

// ============================================================
// ESTRUTURA DE PASTAS
// ============================================================

const ESTRUTURA_PASTAS = Object.freeze({
  ROOT: {
    nome: 'PEDAGOGO.AI',
    subpastas: {
      '01_PLANEJAMENTO': {
        nome: '01_PLANEJAMENTO',
        subpastas: {
          'Sequencias_Didaticas': { nome: 'Sequencias_Didaticas', subpastas: {} },
          'Templates':            { nome: 'Templates',            subpastas: {} }
        }
      },
      '02_AVALIACAO': {
        nome: '02_AVALIACAO',
        subpastas: {
          'Banco_de_Questoes': {
            nome: 'Banco_de_Questoes',
            subpastas: {
              'Objetivas':   { nome: 'Objetivas',   subpastas: {} },
              'Discursivas': { nome: 'Discursivas', subpastas: {} }
            }
          },
          'Provas_Geradas': { nome: 'Provas_Geradas', subpastas: {} },
          'Gabaritos':      { nome: 'Gabaritos',      subpastas: {} }
        }
      },
      '03_RESULTADOS': {
        nome: '03_RESULTADOS',
        subpastas: {
          'Notas_e_Frequencia':    { nome: 'Notas_e_Frequencia',    subpastas: {} },
          'Relatorios_Analiticos': { nome: 'Relatorios_Analiticos', subpastas: {} }
        }
      },
      '04_ALUNOS': {
        nome: '04_ALUNOS',
        subpastas: {
          'Fichas_Individuais': { nome: 'Fichas_Individuais', subpastas: {} },
          'PEI_PDI':            { nome: 'PEI_PDI',            subpastas: {} }
        }
      },
      '05_CONFIGURACOES': { nome: '05_CONFIGURACOES', subpastas: {} },
      '06_PROFESSORES': {  // Sprint 3 — Pastas individuais dos professores
        nome: '06_PROFESSORES',
        subpastas: {
          '_COMPARTILHADOS': {
            nome: '_COMPARTILHADOS',
            subpastas: {
              'Templates_Aprovados': { nome: 'Templates_Aprovados', subpastas: {} },
              'Boas_Praticas':       { nome: 'Boas_Praticas',       subpastas: {} }
            }
          }
        }
      }
    }
  }
});

// ============================================================
// CRIAÇÃO DE PASTAS
// ============================================================

/**
 * Busca ou cria uma pasta pelo nome dentro de um diretório pai.
 * Idempotente: não cria duplicatas.
 *
 * @param {string} nome
 * @param {GoogleAppsScript.Drive.Folder} pastaParent
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function buscarOuCriarPasta(nome, pastaParent) {
  const existentes = pastaParent.getFoldersByName(nome);
  if (existentes.hasNext()) return existentes.next();
  const nova = pastaParent.createFolder(nome);
  registrarLog('INFO', `Pasta criada: ${nome}`, `Pai: ${pastaParent.getName()}`);
  return nova;
}

/**
 * Cria recursivamente a estrutura de pastas do PEDAGOGO.AI.
 * Salva os IDs das pastas principais no PropertiesService.
 *
 * @returns {Object} Mapa nome → ID das pastas criadas
 */
function criarEstruturaPastas() {
  const raiz = DriveApp.getRootFolder();
  const idsGerados = {};

  const pastaRoot = buscarOuCriarPasta(ESTRUTURA_PASTAS.ROOT.nome, raiz);
  idsGerados.ROOT = pastaRoot.getId();
  salvarPropriedade('ID_PASTA_ROOT', pastaRoot.getId());

  const mapaChaves = {
    '01_PLANEJAMENTO':  'ID_PASTA_PLANEJAMENTO',
    '02_AVALIACAO':     'ID_PASTA_AVALIACAO',
    '03_RESULTADOS':    'ID_PASTA_RESULTADOS',
    '04_ALUNOS':        'ID_PASTA_ALUNOS',
    '05_CONFIGURACOES': 'ID_PASTA_CONFIGURACOES',
    '06_PROFESSORES':   'ID_PASTA_PROFESSORES'    // Sprint 3
  };

  Object.entries(ESTRUTURA_PASTAS.ROOT.subpastas).forEach(([chave, def]) => {
    const pasta = buscarOuCriarPasta(def.nome, pastaRoot);
    const propKey = mapaChaves[chave];
    if (propKey) {
      salvarPropriedade(propKey, pasta.getId());
      idsGerados[chave] = pasta.getId();
    }

    Object.values(def.subpastas || {}).forEach(subdef => {
      const subpasta = buscarOuCriarPasta(subdef.nome, pasta);
      idsGerados[subdef.nome] = subpasta.getId();

      // Sprint 3: salvar ID da pasta _COMPARTILHADOS
      if (subdef.nome === '_COMPARTILHADOS') {
        salvarPropriedade('ID_PASTA_COMPARTILHADOS', subpasta.getId());
      }

      Object.values(subdef.subpastas || {}).forEach(subsubdef => {
        const subsubpasta = buscarOuCriarPasta(subsubdef.nome, subpasta);
        idsGerados[subsubdef.nome] = subsubpasta.getId();
      });
    });
  });

  registrarLog('INFO', 'Estrutura de pastas criada', `${Object.keys(idsGerados).length} pastas`);
  return idsGerados;
}

// ============================================================
// OPERAÇÕES COM ARQUIVOS (Sprint 1 — BUG-04: usar moveTo)
// ============================================================

/**
 * Move um arquivo para uma pasta destino usando a API moderna (Drive v3).
 * Substitui o padrão addFile/removeFile que era frágil.
 *
 * @param {GoogleAppsScript.Drive.File} arquivo
 * @param {GoogleAppsScript.Drive.Folder} pastaDestino
 */
function moverArquivoParaPasta(arquivo, pastaDestino) {
  arquivo.moveTo(pastaDestino);
}

/**
 * Cria um Google Doc com conteúdo e o move para a pasta do professor.
 * Sprint 3: arquivos vão para a pasta pessoal do professor, não para a genérica.
 *
 * @param {string} titulo    - Título do documento
 * @param {string} conteudo  - Conteúdo em texto simples / Markdown
 * @param {string} [nomePasta] - Subpasta dentro da pasta do professor
 * @returns {string} URL do documento criado
 */
function salvarDocumentoPlano(titulo, conteudo, nomePasta) {
  const config = getConfig();

  const doc = DocumentApp.create(titulo);
  const body = doc.getBody();
  body.clear();

  // Cabeçalho institucional
  const cabecalho = body.appendParagraph(config.ESCOLA);
  cabecalho.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(config.SECRETARIA).setItalic(true);
  body.appendHorizontalRule();
  body.appendParagraph(conteudo);
  doc.saveAndClose();

  // Sprint 3: mover para pasta do professor
  const arquivo = DriveApp.getFileById(doc.getId());
  const pastaDestino = obterSubpastaProfessor('Planos_de_Aula', nomePasta);
  arquivo.moveTo(pastaDestino);

  registrarLog('INFO', `Plano salvo: ${titulo}`, doc.getUrl());
  return doc.getUrl();
}

/**
 * Obtém (ou cria) a subpasta de planos para uma turma/disciplina/ano específicos.
 * Sprint 3: agora usa a pasta do professor em vez da pasta genérica.
 *
 * @param {string} nomePasta - Ex: '2026_6A_PortuguesEF2'
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function obterPastaPlanoDeAula(nomePasta) {
  // Delegar para PastaProfessor se disponível (Sprint 3)
  try {
    return obterSubpastaProfessor('Planos_de_Aula', nomePasta);
  } catch (_) {
    // Fallback para pasta genérica se PastaProfessor não disponível
    const config = getConfig();
    const idPlanejamento = config.DRIVE.PLANEJAMENTO;
    if (!idPlanejamento) throw new Error('Pasta 01_PLANEJAMENTO não configurada. Execute o SetupInicial.');
    const pastaPlanejamento = DriveApp.getFolderById(idPlanejamento);
    const pastaPlanos = buscarOuCriarPasta('Planos_de_Aula', pastaPlanejamento);
    return buscarOuCriarPasta(nomePasta || 'Geral', pastaPlanos);
  }
}

/**
 * Salva um documento de prova na pasta correta.
 *
 * @param {string} docId
 * @param {string} turma
 * @param {string} bimestre - Ex: '1B_2026'
 * @returns {string} URL do arquivo
 */
function salvarProva(docId, turma, bimestre) {
  const config = getConfig();
  const idAvaliacao = config.DRIVE.AVALIACAO;
  if (!idAvaliacao) throw new Error('Pasta 02_AVALIACAO não configurada.');

  const pastaAvaliacao = DriveApp.getFolderById(idAvaliacao);
  const pastaProvas = buscarOuCriarPasta('Provas_Geradas', pastaAvaliacao);
  const pastaDestino = buscarOuCriarPasta(`${bimestre}_${turma}`, pastaProvas);

  const arquivo = DriveApp.getFileById(docId);
  arquivo.moveTo(pastaDestino);   // BUG-04 corrigido

  registrarLog('INFO', `Prova salva: ${arquivo.getName()}`, `Pasta: ${bimestre}_${turma}`);
  return arquivo.getUrl();
}

/**
 * Salva gabarito na pasta protegida.
 * Gabaritos são compartilhados APENAS após a aplicação da prova.
 *
 * @param {string} docId
 * @returns {string} URL do gabarito
 */
function salvarGabarito(docId) {
  const config = getConfig();
  const idAvaliacao = config.DRIVE.AVALIACAO;
  if (!idAvaliacao) throw new Error('Pasta 02_AVALIACAO não configurada.');

  const pastaAvaliacao = DriveApp.getFolderById(idAvaliacao);
  const pastaGabaritos = buscarOuCriarPasta('Gabaritos', pastaAvaliacao);

  const arquivo = DriveApp.getFileById(docId);
  arquivo.moveTo(pastaGabaritos);  // BUG-04 corrigido

  // Acesso privado ao gabarito
  arquivo.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);

  registrarLog('INFO', `Gabarito salvo e protegido: ${arquivo.getName()}`);
  return arquivo.getUrl();
}

/**
 * Salva relatório analítico na pasta de resultados.
 *
 * @param {string} docId
 * @param {string} turma
 * @param {boolean} ehPublico
 * @returns {string} URL
 */
function salvarRelatorio(docId, turma, ehPublico) {
  const config = getConfig();
  const idResultados = config.DRIVE.RESULTADOS;
  if (!idResultados) throw new Error('Pasta 03_RESULTADOS não configurada.');

  const pastaResultados = DriveApp.getFolderById(idResultados);
  const pastaRel = buscarOuCriarPasta('Relatorios_Analiticos', pastaResultados);
  const nomePasta = `${turma}_${formatarData(new Date(), 'yyyy')}`;
  const pastaDestino = buscarOuCriarPasta(nomePasta, pastaRel);

  const arquivo = DriveApp.getFileById(docId);
  arquivo.moveTo(pastaDestino);  // BUG-04 corrigido

  return arquivo.getUrl();
}

/**
 * Salva documento de PEI/PDI na pasta protegida de alunos.
 * Acesso restrito: apenas coordenação e professor do aluno.
 *
 * @param {string} docId
 * @param {string[]} emailsAutorizados - E-mails com acesso
 * @returns {string} URL
 */
function salvarPEI(docId, emailsAutorizados) {
  const config = getConfig();
  const idAlunos = config.DRIVE.ALUNOS;
  if (!idAlunos) throw new Error('Pasta 04_ALUNOS não configurada.');

  const pastaAlunos = DriveApp.getFolderById(idAlunos);
  const pastaPEI = buscarOuCriarPasta('PEI_PDI', pastaAlunos);

  const arquivo = DriveApp.getFileById(docId);
  arquivo.moveTo(pastaPEI);  // BUG-04 corrigido

  // Restrição de acesso LGPD
  arquivo.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  if (emailsAutorizados && emailsAutorizados.length > 0) {
    emailsAutorizados.filter(e => e && e.includes('@')).forEach(email => {
      try { arquivo.addEditor(email); } catch (_) {}
    });
  }

  registrarLog('INFO', `PEI/PDI salvo com acesso restrito: ${arquivo.getName()}`);
  return arquivo.getUrl();
}

// ============================================================
// BACKUP AUTOMÁTICO
// ============================================================

/**
 * Cria backup das 4 planilhas-mestre em pasta com timestamp.
 * Executado semanalmente pelo trigger.
 */
function criarBackupSemanal() {
  const config = getConfig();
  const idConfiguracoes = config.DRIVE.CONFIGURACOES;
  if (!idConfiguracoes) {
    registrarLog('ALERTA', 'Pasta 05_CONFIGURACOES não configurada — backup não realizado');
    return;
  }

  const pastaConfig = DriveApp.getFolderById(idConfiguracoes);
  const nomePastaBackup = `BACKUP_${timestampArquivo()}`;
  const pastaBackup = pastaConfig.createFolder(nomePastaBackup);

  const sheets = config.SHEETS;
  let copiados = 0;
  Object.entries(sheets).forEach(([nome, id]) => {
    if (!id) return;
    try {
      DriveApp.getFileById(id).makeCopy(`${nome}_BACKUP`, pastaBackup);
      copiados++;
    } catch (e) {
      registrarLog('ERRO', `Falha no backup de ${nome}: ${e.message}`);
    }
  });

  salvarPropriedade('ULTIMO_BACKUP', formatarData(new Date(), 'dd/MM/yyyy HH:mm:ss'));
  registrarLog('INFO', `Backup semanal: ${copiados} planilhas`, `Pasta: ${nomePastaBackup}`);
}
