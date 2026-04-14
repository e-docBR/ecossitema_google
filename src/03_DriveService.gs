/**
 * PEDAGOGO.AI — Serviço do Google Drive
 * Arquivo: 03_DriveService.gs
 * Colégio Municipal de Itabatan | SEME/Mucuri-BA
 *
 * Gerencia a estrutura de pastas e arquivos no Google Drive.
 * Todas as operações de criação/leitura de arquivos passam por aqui.
 * Nunca use DriveApp diretamente em outros módulos — use as funções deste serviço.
 *
 * Referência: Bloco 1.3 do prompt mestre (estrutura de pastas)
 */

// ============================================================
// ESTRUTURA DE PASTAS (Bloco 1.3)
// ============================================================

const ESTRUTURA_PASTAS = Object.freeze({
  ROOT: {
    nome: 'PEDAGOGO.AI',
    subpastas: {
      '01_PLANEJAMENTO': {
        nome: '01_PLANEJAMENTO',
        subpastas: {
          'Planos_de_Aula':        { nome: 'Planos_de_Aula',        subpastas: {} },
          'Sequencias_Didaticas':  { nome: 'Sequencias_Didaticas',  subpastas: {} },
          'Templates':             { nome: 'Templates',             subpastas: {} }
        }
      },
      '02_AVALIACAO': {
        nome: '02_AVALIACAO',
        subpastas: {
          'Banco_de_Questoes': {
            nome: 'Banco_de_Questoes',
            subpastas: {
              'Objetivas':    { nome: 'Objetivas',    subpastas: {} },
              'Discursivas':  { nome: 'Discursivas',  subpastas: {} }
            }
          },
          'Provas_Geradas': { nome: 'Provas_Geradas', subpastas: {} },
          'Gabaritos':      { nome: 'Gabaritos',      subpastas: {} }
        }
      },
      '03_RESULTADOS': {
        nome: '03_RESULTADOS',
        subpastas: {
          'Respostas_Forms':      { nome: 'Respostas_Forms',      subpastas: {} },
          'Notas_e_Frequencia':   { nome: 'Notas_e_Frequencia',   subpastas: {} },
          'Relatorios_Analiticos':{ nome: 'Relatorios_Analiticos',subpastas: {} }
        }
      },
      '04_ALUNOS': {
        nome: '04_ALUNOS',
        subpastas: {
          'Fichas_Individuais': { nome: 'Fichas_Individuais', subpastas: {} },
          'PEI_PDI':            { nome: 'PEI_PDI',            subpastas: {} }
        }
      },
      '05_CONFIGURACOES': {
        nome: '05_CONFIGURACOES',
        subpastas: {}
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
 * @param {string} nome - Nome da pasta
 * @param {Folder} pastaParent - Pasta pai onde criar
 * @returns {Folder} A pasta encontrada ou criada
 */
function buscarOuCriarPasta(nome, pastaParent) {
  const existentes = pastaParent.getFoldersByName(nome);
  if (existentes.hasNext()) {
    return existentes.next();
  }
  const nova = pastaParent.createFolder(nome);
  registrarLog('INFO', `Pasta criada: ${nome}`, `Pai: ${pastaParent.getName()}`);
  return nova;
}

/**
 * Cria recursivamente a estrutura de pastas do PEDAGOGO.AI no Drive raiz do usuário.
 * Salva os IDs das pastas principais no PropertiesService.
 *
 * @returns {Object} Mapa nome → ID das pastas criadas
 */
function criarEstruturaPastas() {
  const raiz = DriveApp.getRootFolder();
  const idsGerados = {};

  // Criar pasta raiz PEDAGOGO.AI
  const pastaRoot = buscarOuCriarPasta(ESTRUTURA_PASTAS.ROOT.nome, raiz);
  idsGerados.ROOT = pastaRoot.getId();
  salvarPropriedade('ID_PASTA_ROOT', pastaRoot.getId());

  // Criar subpastas de primeiro nível e guardar IDs
  const mapaChaves = {
    '01_PLANEJAMENTO':  'ID_PASTA_PLANEJAMENTO',
    '02_AVALIACAO':     'ID_PASTA_AVALIACAO',
    '03_RESULTADOS':    'ID_PASTA_RESULTADOS',
    '04_ALUNOS':        'ID_PASTA_ALUNOS',
    '05_CONFIGURACOES': 'ID_PASTA_CONFIGURACOES'
  };

  Object.entries(ESTRUTURA_PASTAS.ROOT.subpastas).forEach(([chave, def]) => {
    const pasta = buscarOuCriarPasta(def.nome, pastaRoot);
    const propKey = mapaChaves[chave];
    if (propKey) {
      salvarPropriedade(propKey, pasta.getId());
      idsGerados[chave] = pasta.getId();
    }

    // Criar subpastas de segundo nível
    Object.values(def.subpastas || {}).forEach(subdef => {
      const subpasta = buscarOuCriarPasta(subdef.nome, pasta);
      idsGerados[subdef.nome] = subpasta.getId();

      // Criar subpastas de terceiro nível (ex: Objetivas, Discursivas)
      Object.values(subdef.subpastas || {}).forEach(subsubdef => {
        const subsubpasta = buscarOuCriarPasta(subsubdef.nome, subpasta);
        idsGerados[subsubdef.nome] = subsubpasta.getId();
      });
    });
  });

  registrarLog('INFO', 'Estrutura de pastas criada com sucesso', `${Object.keys(idsGerados).length} pastas`);
  return idsGerados;
}

// ============================================================
// OPERAÇÕES COM ARQUIVOS
// ============================================================

/**
 * Cria um Google Doc com o texto fornecido e o salva na pasta correta.
 *
 * @param {string} titulo - Título do documento
 * @param {string} conteudo - Conteúdo em Markdown ou texto simples
 * @param {string} pastaNome - Nome da subpasta destino dentro de 01_PLANEJAMENTO/Planos_de_Aula
 * @returns {string} URL do documento criado
 */
function salvarDocumentoPlano(titulo, conteudo, pastaNome) {
  const config = getConfig();
  const pastaPlanos = obterPastaPlanoDeAula(pastaNome);

  const doc = DocumentApp.create(titulo);
  const body = doc.getBody();
  body.clear();

  // Adicionar cabeçalho institucional
  const cabecalho = body.appendParagraph(config.ESCOLA);
  cabecalho.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  body.appendParagraph(config.SECRETARIA).setItalic(true);
  body.appendHorizontalRule();

  // Conteúdo gerado pelo Gemini
  body.appendParagraph(conteudo);

  doc.saveAndClose();

  // Mover para a pasta correta
  const arquivo = DriveApp.getFileById(doc.getId());
  pastaPlanos.addFile(arquivo);
  DriveApp.getRootFolder().removeFile(arquivo);

  registrarLog('INFO', `Plano de aula salvo: ${titulo}`, `URL: ${doc.getUrl()}`);
  return doc.getUrl();
}

/**
 * Obtém (ou cria) a subpasta de planos para uma turma/disciplina/ano específicos.
 * Formato: Planos_de_Aula/[ANO]_[TURMA]_[DISCIPLINA]/
 *
 * @param {string} nomePasta - Ex: '2026_6A_PortuguesEF2'
 * @returns {Folder} Pasta destino
 */
function obterPastaPlanoDeAula(nomePasta) {
  const config = getConfig();
  const idPlanejamento = config.DRIVE.PLANEJAMENTO;
  if (!idPlanejamento) throw new Error('Pasta 01_PLANEJAMENTO não configurada. Execute o SetupInicial.');

  const pastaPlanejamento = DriveApp.getFolderById(idPlanejamento);
  const planosExistentes = pastaPlanejamento.getFoldersByName('Planos_de_Aula');
  const pastaPlanos = planosExistentes.hasNext()
    ? planosExistentes.next()
    : pastaPlanejamento.createFolder('Planos_de_Aula');

  return buscarOuCriarPasta(nomePasta || 'Geral', pastaPlanos);
}

/**
 * Salva um documento de prova na pasta correta.
 * Formato: 02_AVALIACAO/Provas_Geradas/[ANO]_[BIMESTRE]/
 *
 * @param {string} docId - ID do Google Doc da prova
 * @param {string} turma - Identificador da turma
 * @param {string} bimestre - Ex: '1B_2026'
 * @returns {string} URL do arquivo movido
 */
function salvarProva(docId, turma, bimestre) {
  const config = getConfig();
  const idAvaliacao = config.DRIVE.AVALIACAO;
  if (!idAvaliacao) throw new Error('Pasta 02_AVALIACAO não configurada.');

  const pastaAvaliacao = DriveApp.getFolderById(idAvaliacao);
  const provasExistentes = pastaAvaliacao.getFoldersByName('Provas_Geradas');
  const pastaProvas = provasExistentes.hasNext()
    ? provasExistentes.next()
    : pastaAvaliacao.createFolder('Provas_Geradas');

  const nomePasta = `${bimestre}_${turma}`;
  const pastaDestino = buscarOuCriarPasta(nomePasta, pastaProvas);

  const arquivo = DriveApp.getFileById(docId);
  pastaDestino.addFile(arquivo);
  DriveApp.getRootFolder().removeFile(arquivo);

  registrarLog('INFO', `Prova salva: ${arquivo.getName()}`, `Pasta: ${nomePasta}`);
  return arquivo.getUrl();
}

/**
 * Salva gabarito na pasta protegida de gabaritos.
 * Gabaritos são compartilhados APENAS após a aplicação da prova.
 *
 * @param {string} docId - ID do Google Doc do gabarito
 * @returns {string} URL do gabarito
 */
function salvarGabarito(docId) {
  const config = getConfig();
  const idAvaliacao = config.DRIVE.AVALIACAO;
  if (!idAvaliacao) throw new Error('Pasta 02_AVALIACAO não configurada.');

  const pastaAvaliacao = DriveApp.getFolderById(idAvaliacao);
  const gabaritosExistentes = pastaAvaliacao.getFoldersByName('Gabaritos');
  const pastaGabaritos = gabaritosExistentes.hasNext()
    ? gabaritosExistentes.next()
    : pastaAvaliacao.createFolder('Gabaritos');

  const arquivo = DriveApp.getFileById(docId);
  pastaGabaritos.addFile(arquivo);
  DriveApp.getRootFolder().removeFile(arquivo);

  // Revogar acesso público ao gabarito (apenas o owner pode ver)
  arquivo.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);

  registrarLog('INFO', `Gabarito salvo e protegido: ${arquivo.getName()}`);
  return arquivo.getUrl();
}

/**
 * Salva relatório analítico na pasta de resultados.
 *
 * @param {string} docId - ID do Google Doc do relatório
 * @param {string} turma - Identificador da turma
 * @param {boolean} ehPublico - Se true, usa versão anonimizada
 * @returns {string} URL do relatório
 */
function salvarRelatorio(docId, turma, ehPublico) {
  const config = getConfig();
  const idResultados = config.DRIVE.RESULTADOS;
  if (!idResultados) throw new Error('Pasta 03_RESULTADOS não configurada.');

  const pastaResultados = DriveApp.getFolderById(idResultados);
  const relExistentes = pastaResultados.getFoldersByName('Relatorios_Analiticos');
  const pastaRel = relExistentes.hasNext()
    ? relExistentes.next()
    : pastaResultados.createFolder('Relatorios_Analiticos');

  const nomePasta = `${turma}_${formatarData(new Date(), 'yyyy')}`;
  const pastaDestino = buscarOuCriarPasta(nomePasta, pastaRel);

  const arquivo = DriveApp.getFileById(docId);
  pastaDestino.addFile(arquivo);
  DriveApp.getRootFolder().removeFile(arquivo);

  return arquivo.getUrl();
}

// ============================================================
// BACKUP AUTOMÁTICO
// ============================================================

/**
 * Cria backup das 4 planilhas-mestre em pasta com timestamp.
 * Executado semanalmente pelo trigger de Seguranca.
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
      const arquivo = DriveApp.getFileById(id);
      arquivo.makeCopy(`${nome}_BACKUP`, pastaBackup);
      copiados++;
    } catch (e) {
      registrarLog('ERRO', `Falha no backup de ${nome}: ${e.message}`);
    }
  });

  salvarPropriedade('ULTIMO_BACKUP', formatarData(new Date(), 'dd/MM/yyyy HH:mm:ss'));
  registrarLog('INFO', `Backup semanal concluído: ${copiados} planilhas`, `Pasta: ${nomePastaBackup}`);
}
