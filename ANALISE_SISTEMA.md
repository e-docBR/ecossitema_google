# PEDAGOGO.AI — Análise Técnica Completa
**Data:** Abril 2026 | **Versão analisada:** 1.0 | **Analista:** Claude Sonnet 4.6

---

## ÍNDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Erros Críticos Encontrados](#2-erros-críticos-encontrados)
3. [Erros Moderados / Bugs](#3-erros-moderados--bugs)
4. [Melhorias de Arquitetura](#4-melhorias-de-arquitetura)
5. [Pasta por Professor — Isolamento Completo](#5-pasta-por-professor--isolamento-completo)
6. [BNCC — Reestruturação Completa das Habilidades](#6-bncc--reestruturação-completa-das-habilidades)
7. [Novas Funcionalidades Prioritárias](#7-novas-funcionalidades-prioritárias)
8. [Novas Funcionalidades Secundárias](#8-novas-funcionalidades-secundárias)
9. [Segurança e LGPD](#9-segurança-e-lgpd)
10. [Profissionalização do Sistema](#10-profissionalização-do-sistema)
11. [Ordem de Implementação Recomendada](#11-ordem-de-implementação-recomendada)

---

## 1. RESUMO EXECUTIVO

O sistema PEDAGOGO.AI foi construído com uma arquitetura sólida e bons princípios pedagógicos. Possui módulos bem definidos, gateway único de IA, controle de acesso por papéis e conformidade parcial com LGPD. Porém, a análise identificou **6 erros críticos**, **12 erros moderados** e **28 melhorias/funcionalidades** necessárias para torná-lo um sistema profissional e utilizável em produção.

**Status geral:** 🟡 ATENÇÃO — Funcional em ambiente de teste, mas não pronto para produção.

---

## 2. ERROS CRÍTICOS ENCONTRADOS

### ❌ CRÍTICO-01: Pasta de professor não existe
**Arquivo:** `03_DriveService.gs` — `ESTRUTURA_PASTAS`

A estrutura de pastas é **genérica e compartilhada** entre todos os professores. Qualquer professor que tiver acesso ao Drive consegue ver e editar os documentos dos colegas.

**Problema:** Não há pasta individual por professor. Planos de aula, diagnósticos e provas geradas por "Prof. Maria" ficam na mesma pasta que os do "Prof. João".

**Correção necessária:** Criar pasta `06_PROFESSORES/{email_professor}/` no Drive durante o Setup, com permissão exclusiva do professor + coordenadores. Ver seção 5 para implementação completa.

---

### ❌ CRÍTICO-02: Cache BNCC perde dados a cada execução
**Arquivo:** `02_BNCCService.gs` — linha 39

```javascript
let _cacheBNCC = null;  // ← PROBLEMA
```

O Google Apps Script **reinicia todas as variáveis globais a cada execução**. Isso significa que a cada chamada ao sistema, o cache é `null` e toda a planilha MASTER_BNCC é recarregada. Com 600+ habilidades BNCC, isso é uma chamada Sheets desnecessária em cada request.

**Correção:** Usar `CacheService.getScriptCache()` com TTL de 6 horas para persistir o cache entre execuções.

---

### ❌ CRÍTICO-03: `getConfig()` chama PropertiesService em cada log
**Arquivo:** `01_Utils.gs` — `registrarLog()` linha 24 / `00_Config.gs` — `getConfig()` linha 33

`registrarLog()` é chamado em praticamente toda função do sistema. Dentro dela, chama `getConfig()` que por sua vez executa `PropertiesService.getScriptProperties()`. Isso resulta em dezenas de chamadas ao PropertiesService por request.

**Impacto:** Lentidão significativa. Apps Script tem quota de calls ao PropertiesService.

**Correção:** Implementar singleton com CacheService ou memoizar o resultado de `getConfig()` na execução.

---

### ❌ CRÍTICO-04: `validarCodigoBNCC` rejeita códigos válidos do Ensino Médio e Educação Infantil
**Arquivo:** `01_Utils.gs` — linha 129

```javascript
const regex = /^EF\d{2}[A-Z]{2}\d{2}$/;  // ← só aceita EF (Ensino Fundamental)
```

O system prompt afirma "BNCC completa (Ed. Infantil ao Ensino Médio)", mas o validador **rejeita**:
- `EI01ET01` — Educação Infantil (EI)
- `EM13CNT201` — Ensino Médio (EM)
- `EF01LP01` — Ano 1 (seria válido mas o range check pode falhar)

**Correção:** Estender regex para aceitar prefixos `EI`, `EF` e `EM` com suas estruturas corretas.

---

### ❌ CRÍTICO-05: `_verificarGemini()` sempre verifica só Gemini, ignora provider ativo
**Arquivo:** `12_Seguranca.gs` — linha 211

```javascript
function _verificarGemini() {
  try {
    getGeminiKey();  // ← sempre verifica GEMINI_KEY, mesmo se provider for OpenRouter
    return { status: 'OK', mensagem: 'Chave configurada' };
  } catch (e) {
    return { status: 'CRITICO', mensagem: 'Chave GEMINI_KEY não configurada' };
  }
}
```

Se o admin configurar OpenRouter ou Ollama como provider, o diagnóstico sempre reportará **"CRÍTICO: Chave GEMINI_KEY não configurada"** mesmo que tudo esteja correto.

**Correção:** A função deve verificar a chave do provider ativo, não sempre Gemini.

---

### ❌ CRÍTICO-06: `_gerarPEISemPermissao()` é chamado sem autorização real
**Arquivo:** `10_MenuIA.gs` — linha 1162

```javascript
function gerarPEIHTML(dados) {
  registrarAuditoria('ESCRITA', 'PEI_PDI', ...);
  const url = _gerarPEISemPermissao(dados);  // ← bypassa verificação
  return { url: url };
}
```

O PEI/PDI contém dados **sensíveis LGPD** (diagnóstico, laudo médico, NEE). A função `gerarPEIHTML` apenas registra na auditoria mas **não verifica se o usuário tem permissão de PROFESSOR ou COORDENADOR**. Qualquer pessoa com acesso ao WebApp pode gerar PEI de qualquer aluno.

**Correção:** Adicionar `verificarPermissao(PAPEIS.PROFESSOR)` antes de chamar `_gerarPEISemPermissao`.

---

## 3. ERROS MODERADOS / BUGS

### ⚠️ BUG-01: Inconsistência na verificação de turmas ativas
**Arquivos:** `06_PlanoDeAula.gs:336` vs `12_Seguranca.gs:271`

```javascript
// PlanoDeAula.gs (linha 336) — checa 'true' minúsculo
String(t[7]).toLowerCase() === 'true'

// Seguranca.gs (linha 271) — checa ambos os formatos
String(t[7]) === 'TRUE' || String(t[7]).toLowerCase() === 'true'
```

Se a coluna `Ativo` tiver valor `True` (capitalizado), a primeira função não encontra a turma. Deve-se padronizar usando apenas `.toUpperCase() === 'TRUE'`.

---

### ⚠️ BUG-02: Busca de aluno por nome é frágil
**Arquivo:** `09_Frequencia.gs` — linha 65

```javascript
const aluno = alunos.find(a => 
  String(a[1] || '').trim().toLowerCase() === nomeAluno.toLowerCase()
);
```

A busca por nome completo falha se houver:
- Espaços extras ("João  Silva" vs "João Silva")
- Acentuação inconsistente ("José" vs "Jose")
- Apelidos ou nome social diferente do nome no cadastro

**Correção:** Buscar sempre pelo ID de matrícula, nunca pelo nome.

---

### ⚠️ BUG-03: `calcularDesempenhoPorHabilidade` conta todos como erro
**Arquivo:** `11_Relatorios.gs` — linhas 119-126

```javascript
todasHabilidades[hab].alunosComErro++;  // ← incrementa para TODOS os alunos da lista crítica
```

A lógica extrai habilidades críticas dos resultados, mas incrementa `alunosComErro` para CADA aluno que aparece na lista, sem verificar se aquele aluno errou especificamente aquela habilidade. O percentual de acerto calculado está incorreto.

---

### ⚠️ BUG-04: `salvarDocumentoPlano` não move o arquivo corretamente no Drive
**Arquivo:** `03_DriveService.gs` — linha 171

```javascript
pastaPlanos.addFile(arquivo);
DriveApp.getRootFolder().removeFile(arquivo);
```

No Google Drive, um arquivo pode estar em múltiplas pastas (é uma referência, não uma cópia). `removeFile` remove a referência da pasta raiz, mas se o arquivo já estiver em outra pasta (ex: "Compartilhados comigo"), a remoção pode falhar silenciosamente. Deve-se usar `arquivo.moveTo(pastaDestino)` que é a API correta para mover arquivos no Drive moderno.

---

### ⚠️ BUG-05: `enviarEmailAlerta` com lista mista de e-mails pode falhar silenciosamente
**Arquivo:** `01_Utils.gs` — linha 238

Se `config.EMAIL.COORDENACAO` estiver vazio e `config.EMAIL.DIRECAO` tiver valor, o filtro funciona. Mas se ambos estiverem vazios, o sistema não avisa que o e-mail não foi enviado — apenas loga um alerta. Em situações críticas (alunos no limite de faltas), o coordenador nunca recebe o alerta.

---

### ⚠️ BUG-06: `registrarLog` é lento por ler o arquivo inteiro a cada chamada
**Arquivo:** `01_Utils.gs` — linha 38

```javascript
const conteudoAtual = arquivo.getBlob().getDataAsString();
// ...
arquivo.setContent(conteudoAtual + linha);
```

Para cada log, o sistema lê o arquivo inteiro, concatena e reescreve. Com 10.000 linhas (limite configurado), cada log faz uma leitura de ~500KB e reescrita. Em uma operação que gera 20 logs, isso representa 10MB de I/O de Drive desnecessário.

**Correção:** Usar `append` (via DriveApp com blob) ou acumular logs em memória e escrever uma vez ao final da execução.

---

### ⚠️ BUG-07: Proteção de colunas LGPD não verifica e-mails antes de aplicar
**Arquivo:** `14_SetupInicial.gs` — linha 230

```javascript
const editoresSensiveis = [emailCoordenacao, emailDirecao].filter(e => e);
protegerColunas(idTurmasAlunos, 'Matrículas', colunasSensiveis, editoresSensiveis);
```

Se `emailCoordenacao` e `emailDirecao` estiverem vazios no momento do Setup, `editoresSensiveis` será `[]` e as colunas sensíveis ficarão **sem nenhum editor** (nem o admin). Os dados sensíveis se tornam inacessíveis para edição por qualquer pessoa.

---

### ⚠️ BUG-08: Regex do Forms aceita código BNCC inválido
**Arquivo:** `06_PlanoDeAula.gs` — linha 274

```javascript
.requireTextMatchesPattern('EF\\d{2}[A-Z]{2}\\d{2}')
```

A regex do formulário não ancora no início e fim (`^...$`), portanto aceita strings como `"texto aleatório EF06LP05 mais texto"` como válidas. Use `^EF\\d{2}[A-Z]{2}\\d{2}$`.

---

### ⚠️ BUG-09: `_obterUI()` pode falhar em contexto de WebApp
**Arquivo:** `10_MenuIA.gs` — linha 618

No WebApp (`doGet`), tanto `DocumentApp.getUi()` quanto `SpreadsheetApp.getUi()` lançam exceção. As funções que chamam `_obterUI()` no contexto de WebApp falharão. Algumas funções como `criarDiagnosticoFormativo` usam `_obterUI()` misturado com lógica de negócio.

---

### ⚠️ BUG-10: Timeout em operações longas sem tratamento
**Arquivo:** `08_CorrectionEngine.gs` / `11_Relatorios.gs`

Google Apps Script tem timeout de **6 minutos** para execuções síncronas. A correção em lote (`corrigirLoteRedacoes`) pode ultrapassar esse limite com turmas grandes. Não há mecanismo de continuação (chunking) ou execução assíncrona via trigger.

---

### ⚠️ BUG-11: `anonimizarNome` não funciona para nomes com apenas uma palavra
**Arquivo:** `01_Utils.gs` — linha 207

```javascript
const partes = nomeCompleto.trim().split(/\s+/);
return partes.map(p => p.charAt(0).toUpperCase() + '.').join('');
```

Para o nome "Raí" (nome social sem sobrenome), retorna "R." — adequado. Mas para "Maria das Graças Silva", retorna "M.D.G.S." que ainda pode identificar o aluno em turmas pequenas (6-8 alunos). Para LGPD adequada, deve retornar apenas "Aluno X" ou usar hash.

---

### ⚠️ BUG-12: O campo "Duração" no formulário de plano usa escala 1-10, mas converte para minutos multiplicando por 50
**Arquivo:** `06_PlanoDeAula.gs` — linha 360 / `10_MenuIA.gs` — linha 932

A escala retorna o número de aulas (1-10), que é convertido para minutos. Mas o campo no formulário mostra "Duração (em aulas de 50min)" — se o professor informar "2", o sistema interpreta como 2 aulas = 100 minutos, o que é correto. Porém o FormApp `ScaleItem` retorna uma string, e `parseInt(valor, 10) * 50` funcionará, mas no mapeamento do formulário (`_mapearRespostasFormulario`) busca por `titulo.includes('duração')` e converte diretamente — a conversão *já multiplica* por 50. No `gerarPlanoDeAulaHTML`, multiplica por 50 novamente. **Risco de double-multiplication**.

---

## 4. MELHORIAS DE ARQUITETURA

### 🔧 ARQ-01: Singleton para `getConfig()` com CacheService

```javascript
// Implementar assim:
let _configCache = null;
function getConfig() {
  if (_configCache) return _configCache;
  const cached = CacheService.getScriptCache().get('PEDAGOGO_CONFIG');
  if (cached) {
    _configCache = Object.freeze(JSON.parse(cached));
    return _configCache;
  }
  // ... build config ...
  CacheService.getScriptCache().put('PEDAGOGO_CONFIG', JSON.stringify(config), 3600);
  _configCache = config;
  return config;
}
```

---

### 🔧 ARQ-02: Cache BNCC persistente com CacheService

```javascript
function _obterCacheBNCC() {
  // 1. Memória (mesmo request)
  if (_cacheBNCC) return _cacheBNCC;
  
  // 2. CacheService (até 6h)
  const cached = CacheService.getScriptCache().get('BNCC_CACHE');
  if (cached) {
    _cacheBNCC = JSON.parse(cached);
    return _cacheBNCC;
  }
  
  // 3. Planilha (fallback)
  // ... carrega da planilha ...
  CacheService.getScriptCache().put('BNCC_CACHE', JSON.stringify(_cacheBNCC), 21600); // 6h
  return _cacheBNCC;
}
```

---

### 🔧 ARQ-03: Substituir `addFile/removeFile` por `moveTo`

```javascript
// Substituir em todos os módulos:
// arquivo.makeCopy(nome, pastaDestino);  // para cópias
arquivo.moveTo(pastaDestino);  // para mover (Drive API v3)
```

---

### 🔧 ARQ-04: Log assíncrono com buffer

Acumular logs em uma variável global do request e escrever em batch ao final. Usar `PropertiesService.getScriptProperties()` como buffer temporário para logs críticos que não podem esperar.

---

### 🔧 ARQ-05: Separação de contexto Docs vs Sheets vs WebApp

Criar módulo `00_Contexto.gs` que detecta o contexto de execução e adapta o comportamento:

```javascript
const CONTEXTO = Object.freeze({
  DOCS:   'docs',
  SHEETS: 'sheets',
  WEBAPP: 'webapp',
  STANDALONE: 'standalone'
});

function detectarContexto() { ... }
```

---

## 5. PASTA POR PROFESSOR — ISOLAMENTO COMPLETO

Esta é a funcionalidade mais importante solicitada. Cada professor deve ter uma pasta **exclusiva** no Drive, com acesso restrito apenas a ele e aos coordenadores/gestores.

### 5.1 Nova Estrutura de Pastas

```
PEDAGOGO.AI/
├── 01_PLANEJAMENTO/          (institucional - coordenação vê tudo)
│   ├── Templates/
│   └── Sequencias_Didaticas/
├── 02_AVALIACAO/             (coordenação vê tudo)
│   ├── Banco_de_Questoes/
│   ├── Provas_Geradas/
│   └── Gabaritos/            (acesso restrito)
├── 03_RESULTADOS/            (coordenação vê tudo)
├── 04_ALUNOS/                (acesso: coordenação + professor da turma)
│   ├── Fichas_Individuais/
│   └── PEI_PDI/              (sensível - apenas coordenação)
├── 05_CONFIGURACOES/         (apenas admin/gestor)
└── 06_PROFESSORES/           ← NOVO
    ├── prof_maria_silva/     (acesso: prof. Maria + coordenação)
    │   ├── Planos_de_Aula/
    │   ├── Avaliações/
    │   ├── Diagnósticos/
    │   └── Comunicados/
    ├── prof_joao_santos/     (acesso: prof. João + coordenação)
    │   └── ...
    └── _COMPARTILHADOS/      (acesso: todos os professores - somente leitura)
        ├── Templates_Aprovados/
        └── Boas_Praticas/
```

### 5.2 Novo Módulo: `16_PastaProfessor.gs`

**Funções a implementar:**

```javascript
/**
 * Cria ou recupera a pasta exclusiva do professor ativo.
 * Chamado automaticamente antes de salvar qualquer documento.
 * @returns {Folder} Pasta do professor
 */
function obterPastaProfessor();

/**
 * Cria pasta para um professor específico durante o cadastro.
 * @param {string} emailProfessor - E-mail institucional do professor
 * @param {string[]} emailsCoordenadores - E-mails com acesso de leitura
 */
function criarPastaProfessor(emailProfessor, emailsCoordenadores);

/**
 * Configura permissões corretas na pasta do professor:
 * - Professor: Editor
 * - Coordenadores/Gestor: Leitor (podem visualizar mas não editar)
 * - Outros: Sem acesso
 */
function configurarPermissoesPastaProfessor(pasta, emailProfessor);

/**
 * Salva documento na pasta correta do professor.
 * Determina automaticamente a subpasta pelo tipo de documento.
 * @param {string} docId - ID do documento
 * @param {string} tipoDocumento - 'plano_aula' | 'avaliacao' | 'diagnostico' | 'comunicado'
 * @returns {string} URL do arquivo na pasta do professor
 */
function salvarNaPastaProfessor(docId, tipoDocumento);

/**
 * Lista todos os documentos do professor atual.
 * @param {string} [tipo] - Filtrar por tipo
 * @returns {Object[]} Lista de documentos com URL e data
 */
function listarDocumentosProfessor(tipo);

/**
 * Move documento para a pasta compartilhada (apenas coordenação pode fazer).
 * @param {string} docId - ID do documento
 */
function compartilharDocumentoParaTodos(docId);
```

### 5.3 Alterações nos módulos existentes

**`06_PlanoDeAula.gs` — `gerarPlanoDeAula()`:**
```javascript
// Linha atual:
const urlDoc = salvarDocumentoPlano(tituloDoc, textoPlano, nomePasta);

// Substituir por:
const pasta = obterPastaProfessor(); // pasta específica do professor
const urlDoc = salvarDocumentoProfessor(tituloDoc, textoPlano, pasta, 'plano_aula');
```

**`11_Relatorios.gs` — `_criarDocRelatorio()`:**
```javascript
// Versão professor → pasta do professor (com permissão)
// Versão pública → pasta 03_RESULTADOS (anonimizada)
```

**`10_MenuIA.gs` — Comunicado para família:**
```javascript
// Comunicados salvos na pasta do professor que os gerou
```

### 5.4 Cadastro de Professor (novo fluxo no Setup)

No `SetupWizard.html`, adicionar **Etapa 7 — Cadastro de Professores**:
1. Admin informa lista de e-mails dos professores
2. Sistema cria pasta individual para cada um
3. Define permissões automaticamente
4. Envia e-mail de boas-vindas com link para a pasta

---

## 6. BNCC — REESTRUTURAÇÃO COMPLETA DAS HABILIDADES

### 6.1 Problemas atuais no BNCCService

| Problema | Impacto |
|----------|---------|
| Só aceita prefixo `EF` | EI (Ed. Infantil) e EM (Ensino Médio) são rejeitados |
| Sem filtro por Nível de Bloom | Impossível gerar questões alinhadas ao nível cognitivo |
| Sem relação entre habilidades e competências gerais | Relatórios incompletos |
| Sem mapeamento EJA ↔ EF regular | Professores de EJA não encontram habilidades equivalentes |
| Cache perde dados a cada execução | Performance ruim |
| Sem busca por texto (fulltext search) | Difícil encontrar habilidades sem saber o código |
| Sem histórico de uso por habilidade | Não sabe quais habilidades foram mais trabalhadas |
| Sem suporte a habilidades municipais complementares | Currículo municipal não pode ser adicionado |

### 6.2 Nova estrutura da planilha MASTER_BNCC

**Aba `Habilidades` — colunas expandidas:**

| Col | Nome | Descrição |
|-----|------|-----------|
| A | Codigo_BNCC | EF06LP05 / EM13CNT201 / EI01ET01 |
| B | Prefixo | EF / EM / EI / CM (currículo municipal) |
| C | Componente | Língua Portuguesa |
| D | Area_Conhecimento | Linguagens / Matemática / CN / CH |
| E | Ano_Serie | 6º Ano / EJA Segmento II / Infantil 5 anos |
| F | Ano_Numero | 6 (apenas o número, para filtros) |
| G | Campo_Tematico | Campo de atuação / Eixo |
| H | Unidade_Tematica | Ex: Leitura, Escrita, Oralidade |
| I | Objeto_Conhecimento | Objeto específico |
| J | Descricao_Habilidade | Descrição completa |
| K | Nivel_Bloom | Lembrar / Compreender / Aplicar / Analisar / Avaliar / Criar |
| L | Nivel_Bloom_Numero | 1-6 (para ordenação) |
| M | Competencias_Gerais | "1;3;7" — competências gerais relacionadas |
| N | Descritores_SAEB | "D1;D15" — descritores relacionados |
| O | Habilidades_EJA_Equiv | Habilidades equivalentes para EJA |
| P | Palavras_Chave | Para busca fulltext |
| Q | Total_Uso | Counter de quantas vezes foi usada |
| R | Ativo | TRUE/FALSE |
| S | Observacoes | Notas do coordenador pedagógico |

**Aba `Competencias_Gerais` — expandida:**

| Col | Nome |
|-----|------|
| A | Numero (1-10) |
| B | Titulo |
| C | Descricao_Completa |
| D | Habilidades_Relacionadas |
| E | Indicadores_Avaliacao |

**Aba `Mapeamento_EJA` — nova:**

| Col | Nome |
|-----|------|
| A | Habilidade_EF_Regular |
| B | Habilidade_EJA_Equiv |
| C | Segmento_EJA |
| D | Adaptacao_Necessaria |

**Aba `Progressao_Vertical` — nova:**
Mostra a progressão de uma habilidade do 1º ao 9º ano, permitindo ao professor visualizar o que veio antes e o que virá depois da habilidade trabalhada.

### 6.3 Novas funções do BNCCService

```javascript
/**
 * Busca habilidades por texto livre (descrição, palavras-chave).
 * Usado pelo autocomplete da sidebar.
 */
function buscarHabilidadesPorTexto(texto, limite);

/**
 * Retorna a progressão vertical de uma habilidade.
 * Ex: para EF06LP05, retorna as habilidades EF01-EF09 do mesmo eixo.
 */
function buscarProgressaoVertical(codigoBNCC);

/**
 * Retorna habilidades equivalentes para EJA.
 * Usado quando professor de EJA busca habilidades.
 */
function buscarEquivalentesEJA(codigoBNCC);

/**
 * Retorna as competências gerais relacionadas a uma habilidade.
 */
function buscarCompetenciasGerais(codigoBNCC);

/**
 * Retorna habilidades do mesmo campo temático (para interdisciplinaridade).
 */
function buscarHabilidadesMesmoCampo(codigoBNCC, outrosComponentes);

/**
 * Registra uso de uma habilidade (incrementa contador).
 * Chamado automaticamente ao gerar plano ou questão.
 */
function registrarUsoHabilidade(codigoBNCC);

/**
 * Retorna as habilidades mais usadas pelos professores.
 * Usado para sugestões no formulário de plano de aula.
 */
function listarHabilidadesMaisUsadas(componente, anoSerie, limite);

/**
 * Valida código BNCC para todos os prefixos (EI, EF, EM, CM).
 * Substitui validarCodigoBNCC() atual.
 */
function validarCodigoBNCCCompleto(codigo);

/**
 * Importa habilidades municipais complementares.
 * Permite adicionar habilidades do currículo municipal de Mucuri-BA.
 */
function importarHabilidadesMunicipais(dados);
```

### 6.4 Melhorias no Prompt do Gemini para BNCC

Ao gerar planos de aula, incluir:
- Competências gerais relacionadas à habilidade
- Progressão vertical (o que o aluno precisa saber antes)
- Habilidades do bimestre anterior que devem ser retomadas
- Sugestão de habilidades correlatas de outros componentes (interdisciplinaridade)

---

## 7. NOVAS FUNCIONALIDADES PRIORITÁRIAS

### 🆕 FUNC-01: Cadastro e Perfil do Professor

**Módulo:** `16_ProfessorService.gs`

Cada professor deve ter um **perfil no sistema** que inclui:
- Nome completo e e-mail institucional
- Disciplinas que leciona
- Turmas que está alocado
- Carga horária
- Formação acadêmica (para personalizar sugestões da IA)
- Data de ingresso na escola

**Onde armazenar:** Nova aba `Professores` na planilha `TURMAS_ALUNOS`.

**Uso:** A IA usa o perfil para personalizar o tom, sugerir habilidades específicas das disciplinas do professor, e filtrar turmas automaticamente.

---

### 🆕 FUNC-02: Dashboard do Professor (visão individual)

O WebApp atual mostra indicadores globais. Criar **visão do professor** que mostra:
- Apenas as **suas turmas** e disciplinas
- Atalhos para os seus últimos documentos
- Alertas de frequência apenas das suas turmas
- Próximas avaliações agendadas
- Habilidades BNCC mais usadas por ele

---

### 🆕 FUNC-03: Calendário Pedagógico Integrado

**Módulo:** `17_CalendarioService.gs`

- Integração com **Google Calendar** via CalendarApp
- Cadastrar o calendário escolar (início/fim de bimestres, feriados, reuniões)
- Gerar sequência didática com datas reais (o plano sabe que a aula é dia 15/04, terça-feira)
- Alertas automáticos para prazos de lançamento de notas
- Visualização mensal dos planos de aula gerados

---

### 🆕 FUNC-04: Lançamento de Notas Integrado

Atualmente o sistema apenas **lê** notas da planilha. Criar interface para **lançar notas**:

```
Turma: 7A | Componente: Matemática | Avaliação: 1ª Prova | Data: 15/04/2026
┌──────────────────────┬───────────┬───────────┬──────────────┐
│ Aluno                │ Nota      │ Faltas    │ Recuperação? │
├──────────────────────┼───────────┼───────────┼──────────────┤
│ João da Silva        │ [  7,5  ] │ 2         │ Não          │
│ Maria dos Santos     │ [  4,0  ] │ 1         │ Sim ⚠️       │
│ Pedro Oliveira       │ [  9,0  ] │ 0         │ Não          │
└──────────────────────┴───────────┴───────────┴──────────────┘
[Salvar Notas]  [Calcular Médias]  [Gerar Relatório]
```

- Calcular médias automáticas
- Alertar alunos em recuperação
- Exportar para planilha com um clique

---

### 🆕 FUNC-05: Sequência Didática Anual (Planejamento por Bimestre)

Gerar **plano anual completo** de um componente curricular:
- Distribuição das habilidades BNCC por bimestre
- Considerando o calendário escolar real
- Com sugestão de carga horária por habilidade
- Exportar como Google Docs com tabela formatada
- Salvar na pasta do professor com versão para coordenação

---

### 🆕 FUNC-06: Notificações Push (Google Chat / E-mail)

Sistema de notificações que envia alertas automaticamente:

| Evento | Destinatário | Canal |
|--------|-------------|-------|
| Aluno com >20% faltas | Professor + Família | E-mail |
| Aluno com <5,0 na média | Professor + Coordenação | E-mail |
| Nota não lançada (7 dias após prazo) | Professor | E-mail |
| PEI não gerado (aluno NEE cadastrado) | Coordenação | E-mail |
| Diagnóstico semanal com críticos | Gestão | E-mail |
| Prova digital respondida | Professor | E-mail |

---

### 🆕 FUNC-07: Busca Unificada no WebApp

Campo de busca global no WebApp que permite pesquisar:
- Alunos (por nome, matrícula, turma)
- Habilidades BNCC (por código ou texto)
- Documentos do professor (planos, provas)
- Relatórios gerados

---

### 🆕 FUNC-08: Importação de Notas via Google Forms

Criar fluxo completo para **provas com gabarito automático**:
1. Professor cria prova no banco de questões
2. Sistema gera Google Forms com as questões objetivas
3. Alunos respondem o Forms
4. Sistema **coleta respostas, compara com gabarito e lança notas automaticamente**
5. Professor revisa antes de confirmar

---

## 8. NOVAS FUNCIONALIDADES SECUNDÁRIAS

### 🆕 FUNC-09: Boletim Individual do Aluno (PDF)

Gerar boletim individual com todas as notas, frequência e observações. Exportar como PDF via `DriveApp`. Enviar por e-mail aos responsáveis.

### 🆕 FUNC-10: Ata de Conselho de Classe com Registros

Além da pauta (já implementada), criar **ata** após o conselho com campo para registrar as decisões tomadas. Armazenar na pasta da coordenação com controle de versão.

### 🆕 FUNC-11: Banco de Boas Práticas

Pasta `_COMPARTILHADOS/Boas_Praticas/` onde os professores compartilham (voluntariamente) seus melhores planos de aula. A coordenação aprova e organiza.

### 🆕 FUNC-12: Relatório de Progresso Individual do Aluno

Para cada aluno, gerar relatório semestral mostrando:
- Evolução das notas por bimestre (gráfico via Sheets)
- Frequência acumulada
- Habilidades consolidadas vs. em desenvolvimento
- Intervenções realizadas
- Recomendações para o próximo período

### 🆕 FUNC-13: Modo Offline (Cache Local no Browser)

Para o WebApp, implementar `localStorage` do browser para salvar formulários parcialmente preenchidos. Evita perda de dados se a conexão cair.

### 🆕 FUNC-14: Histórico de Gerações por Habilidade

Ao abrir uma habilidade BNCC na sidebar, mostrar:
- Quantas vezes foi usada em planos de aula (pela escola toda)
- Últimos planos gerados com essa habilidade
- Resultado médio da turma nas avaliações dessa habilidade

### 🆕 FUNC-15: Adaptação para NEE com Base no Laudo

Ao gerar plano para turma com NEE, o sistema deve:
- Ler o tipo de NEE da planilha TURMAS_ALUNOS
- Personalizar automaticamente a seção de adaptações
- Sugerir recursos de tecnologia assistiva específicos
- Gerar versão adaptada da avaliação lado a lado com a versão padrão

---

## 9. SEGURANÇA E LGPD

### 🔒 SEG-01: Controle de Acesso por Professor/Turma

Atualmente a hierarquia é `PROFESSOR > COORDENADOR > GESTOR > ADMIN`, mas todos os professores veem os dados de todas as turmas. Implementar **controle por turma**:

```javascript
// Novo campo no PropertiesService:
// TURMAS_PROF_joao@escola.edu.br = "7A,7B,8A"
// TURMAS_PROF_maria@escola.edu.br = "6A,6B,9A"

function verificarPermissaoTurma(turma) {
  const email = getUsuarioAtivo();
  const turmasProfessor = getTurmasDoProfessor(email);
  if (!turmasProfessor.includes(turma)) {
    throw new Error(`Você não tem permissão para acessar dados da turma ${turma}.`);
  }
}
```

### 🔒 SEG-02: Rate Limiting para API de IA

Implementar controle de uso da API por professor para evitar uso excessivo:

```javascript
// Limite: 50 chamadas/dia por professor
function verificarLimiteIA() {
  const email = getUsuarioAtivo();
  const hoje = formatarData(new Date(), 'yyyyMMdd');
  const chave = `IA_CALLS_${email}_${hoje}`;
  const count = parseInt(PropertiesService.getUserProperties().getProperty(chave) || '0');
  if (count >= 50) throw new Error('Limite diário de 50 gerações de IA atingido.');
  PropertiesService.getUserProperties().setProperty(chave, String(count + 1));
}
```

### 🔒 SEG-03: Auditoria de Acesso a Dados Sensíveis

Cada leitura de dados NEE/laudo deve ser registrada com:
- E-mail do usuário
- Timestamp
- IP (não disponível no GAS, mas registrar session ID)
- Motivo declarado (prompt ao usuário antes de abrir dado sensível)

### 🔒 SEG-04: Política de Retenção de Dados

Implementar rotina automática (trigger mensal) que:
- Anonimiza dados de alunos formados há mais de 5 anos
- Remove logs com mais de 1 ano
- Envia relatório de retenção para a gestão

### 🔒 SEG-05: Revogar Acesso de Professor Desligado

Quando um professor é desativado (coluna `Status = Inativo` em `Professores`):
- Remover suas permissões de todas as pastas compartilhadas
- Mover seus documentos para pasta de arquivo (somente leitura)
- Notificar coordenação

---

## 10. PROFISSIONALIZAÇÃO DO SISTEMA

### 🏢 PROF-01: Versão Multi-escola (SEME/Mucuri-BA)

O sistema atual é hard-coded para o Colégio de Itabatan. Preparar para expandir para todas as escolas da rede municipal:

```javascript
// Em 00_Config.gs, adicionar:
REDE: {
  NOME: 'Rede Municipal de Ensino de Mucuri-BA',
  SECRETARIA: 'SEME/Mucuri-BA',
  ESCOLAS: [] // carregado do PropertiesService
}
```

### 🏢 PROF-02: Onboarding Guiado para Novos Professores

Quando um professor faz login pela primeira vez (sem histórico de uso), exibir wizard de onboarding:
1. Apresentação do sistema
2. Cadastro das disciplinas que leciona
3. Seleção das turmas
4. Configuração de preferências (nível de detalhe dos planos, etc.)
5. Tutorial interativo da sidebar

### 🏢 PROF-03: Versionamento de Documentos

Ao gerar uma nova versão de um plano de aula já existente, criar nova versão em vez de sobrescrever. Manter histórico de versões na pasta do professor.

### 🏢 PROF-04: Integração com Google Classroom

```javascript
// Publicar plano de aula diretamente em uma turma do Classroom
function publicarNoClassroom(docId, turmaClassroomId, titulo);

// Importar lista de alunos do Classroom (evitar cadastro manual)
function importarAlunosClassroom(turmaClassroomId);
```

### 🏢 PROF-05: Métricas de Uso do Sistema

Dashboard para gestão visualizar:
- Professores mais ativos (mais planos gerados)
- Habilidades BNCC mais trabalhadas
- Taxa de aprovação por turma/componente/bimestre
- Número de PEIs gerados
- Alertas de frequência enviados no mês

### 🏢 PROF-06: Exportação de Relatórios em PDF

Todos os relatórios gerados (planos, avaliações, boletins) devem ter opção de exportar como PDF via `DriveApp.createFile` com `MimeType.PDF`. O PDF deve ter o cabeçalho da escola formatado corretamente.

### 🏢 PROF-07: Modo de Demonstração (Dados Fictícios)

Para apresentações e treinamentos, um "modo demo" que usa dados fictícios de turmas e alunos sem expor dados reais. Controlado por propriedade `MODO_DEMO=true`.

### 🏢 PROF-08: Suporte a Múltiplos Idiomas de Interface

Preparar as strings da UI para internacionalização (i18n), mesmo que inicialmente seja apenas PT-BR. Facilita eventual adaptação para outras redes municipais.

---

## 11. ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### SPRINT 1 — Correções Críticas (fazer AGORA)
1. **CRÍTICO-06:** Adicionar verificação de permissão no `gerarPEIHTML`
2. **CRÍTICO-05:** Corrigir `_verificarGemini()` para checar provider ativo
3. **BUG-04:** Substituir `addFile/removeFile` por `moveTo`
4. **BUG-08:** Corrigir regex do Forms (adicionar `^` e `$`)
5. **BUG-01:** Padronizar verificação de turmas ativas

### SPRINT 2 — Performance e Estabilidade
1. **CRÍTICO-02:** Implementar CacheService para BNCC
2. **CRÍTICO-03:** Memoizar `getConfig()` com CacheService
3. **BUG-06:** Otimizar sistema de log (buffer + batch write)
4. **BUG-07:** Validar e-mails antes de aplicar proteções LGPD
5. **BUG-10:** Implementar chunking para operações longas

### SPRINT 3 — Pasta do Professor (funcionalidade principal solicitada)
1. Criar `16_PastaProfessor.gs` com todas as funções descritas na seção 5
2. Criar aba `Professores` na planilha `TURMAS_ALUNOS`
3. Atualizar `06_PlanoDeAula.gs` para salvar na pasta do professor
4. Atualizar `11_Relatorios.gs` para salvar na pasta correta
5. Atualizar `10_MenuIA.gs` (comunicados, PEI, diagnósticos)
6. Atualizar `SetupWizard.html` com Etapa de Cadastro de Professores

### SPRINT 4 — BNCC Profissional
1. Expandir schema da planilha `MASTER_BNCC` (novas colunas)
2. Corrigir `validarCodigoBNCC` para aceitar EI e EM
3. Implementar `buscarHabilidadesPorTexto()` (fulltext search)
4. Implementar `buscarProgressaoVertical()`
5. Implementar `registrarUsoHabilidade()`
6. Adicionar competências gerais ao prompt do Gemini

### SPRINT 5 — Novas Funcionalidades Core
1. FUNC-01: Cadastro e Perfil do Professor
2. FUNC-04: Lançamento de Notas Integrado
3. FUNC-02: Dashboard do Professor (visão individual)
4. FUNC-06: Notificações automáticas

### SPRINT 6 — Profissionalização e Integrações
1. FUNC-03: Calendário Pedagógico Integrado (Google Calendar)
2. FUNC-08: Importação de Notas via Forms
3. PROF-04: Integração com Google Classroom
4. SEG-01: Controle de Acesso por Turma
5. SEG-02: Rate Limiting para API de IA

---

## APÊNDICE — Checklist de Revisão de Código

### Antes de cada nova feature:
- [ ] Verificar permissão com `verificarPermissao()` antes de acessar dados sensíveis
- [ ] Usar `moveTo()` em vez de `addFile/removeFile`
- [ ] Validar código BNCC com `validarCodigoBNCCCompleto()` (após correção do CRÍTICO-04)
- [ ] Registrar log com `registrarLog()` no início e fim de operações importantes
- [ ] Chamar `registrarAuditoria()` ao ler/escrever dados pessoais
- [ ] Usar `sanitizarCelula()` para dados do usuário que vão para Sheets
- [ ] Não expor chaves de API em logs
- [ ] Testar com usuário sem permissão (deve lançar erro descritivo)
- [ ] Testar com planilhas vazias (não deve quebrar)
- [ ] Verificar se operação pode ultrapassar 6 minutos de timeout

---

*Documento gerado em: 15/04/2026 | PEDAGOGO.AI v1.0 — Análise Técnica*
*Para dúvidas ou priorização: contactar a equipe técnica da SEME/Mucuri-BA*
