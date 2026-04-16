# CHANGELOG — PEDAGOGO.AI

Sistema de Automação Pedagógica  
Colégio Municipal de 1º e 2º Graus de Itabatan | SEME/Mucuri-BA

---

## v2.0 — Sprint 5 (Abril 2026) — Controle de Acesso Completo

### Commit: `136d99f`

#### Arquivos alterados
| Arquivo | Tipo | Resumo |
|---------|------|--------|
| `src/12_Seguranca.gs` | Refactor | `verificarPermissao()` centralizado via `getUsuarioPapel()` |
| `src/10_MenuIA.gs` | Feature | Guards em todos os wrappers HTML + 5 novos wrappers de usuários |
| `src/Sidebar.html` | Feature | Role badge, cards por papel, página de Usuários |
| `src/WebApp.html` | Feature | Role badge no topbar, nav por papel, seção Usuários |
| `src/JS.html` | Fix | `navegarPara()` inicializa página Usuários automaticamente |

#### Detalhes

**`12_Seguranca.gs` — `verificarPermissao()` refatorado**
- Antes: lia PropertiesService diretamente em cada verificação
- Depois: delega para `getUsuarioPapel()` + `nivelPapel()` de `17_Usuarios.gs`
- Benefício: fonte de verdade única; suporta PropertiesService, aba Professores e fallback Drive
- Mensagem de erro agora exibe papel atual vs papel requerido

**`10_MenuIA.gs` — Guards em wrappers HTML**

| Função | Papel requerido |
|--------|----------------|
| `gerarQuestoesTextoHTML()` | PROFESSOR |
| `corrigirTextoHTML()` | PROFESSOR |
| `adaptarConteudoTextoHTML()` | PROFESSOR |
| `gerarPlanoDeAulaHTML()` | PROFESSOR |
| `corrigirSelecionadoHTML()` | PROFESSOR |
| `adaptarParaNEEHTML()` | PROFESSOR |
| `gerarRelatorioTurmaHTML()` | PROFESSOR |
| `redigirComunicadoFamiliaHTML()` | PROFESSOR |
| `criarDiagnosticoFormativoHTML()` | PROFESSOR |
| `lancarFrequenciaLoteHTML()` | PROFESSOR |
| `gerarPautaReuniaoHTML()` | COORDENADOR |
| `matricularAlunoHTML()` | COORDENADOR |
| `gerarPEIHTML()` | PROFESSOR (já existia — CRÍTICO-06) |

Novos wrappers adicionados:
- `obterPerfilUsuarioAtualHTML()` — perfil completo para o frontend
- `listarUsuariosPorPapelHTML()` — requer GESTOR
- `adicionarUsuarioAoPapelHTML()` — requer GESTOR
- `removerUsuarioDoPapelHTML()` — requer GESTOR
- `registrarMeComoAdminHTML()` — bootstrap (sem permissão se EMAILS_ADMIN vazio)

**`Sidebar.html` — Interface por papel**
- Role badge no cabeçalho: email do usuário + label do papel (ex: "Professor(a)")
- Card "Matricular Aluno" (`role-coordenador`) oculto para professores
- Card "Gerenciar Usuários" (`role-gestor`) oculto para não-gestores
- Aviso de bootstrap "Registrar-me como Admin" aparece somente quando sem papel
- Nova página `pg-usuarios` com lista de usuários por papel e formulário de adição/remoção

**`WebApp.html` — Interface por papel**
- Badge de papel ao lado do email na topbar
- Nav item "Matricular Aluno" filtrado para coordenador+
- Nav item "Usuários" filtrado para gestor+
- Nova seção `wa-usuarios` com lista e formulário idênticos à Sidebar
- `wa_init()` chama `obterPerfilUsuarioAtualHTML()` na inicialização

---

## v2.0 — Sprint 4 (Abril 2026) — BNCC v2 e Catálogo Expandido

### Commit: `c62b6da`

#### Arquivos alterados
`02_BNCCService.gs`, `04_SheetsService.gs`, `00_Config.gs`, `05_GeminiService.gs`

- Schema BNCC expandido de 7 → 19 colunas (Segmento, Unidade_Tematica, Competencias, etc.)
- Auto-detecção de schema v1 (≤8 colunas) vs v2 (≥18 colunas)
- `buscarHabilidadesPorTexto()` — busca livre no catálogo BNCC
- `progressaoVertical()` — trajetória de uma habilidade entre anos/séries
- `atualizarContadorUsoHabilidade()` — rastreia uso de cada habilidade (col17 Total_Usos)
- Multi-provider IA: Gemini / OpenRouter / Ollama via gateway unificado
- Autocomplete BNCC no frontend (Sidebar + WebApp)

---

## v2.0 — Sprint 3 (Abril 2026) — Isolamento de Pastas por Professor

### Commit: `c62b6da` (mesmo commit do Sprint 4)

#### Arquivo novo: `16_PastaProfessor.gs`

- Cada professor tem pasta pessoal isolada em `06_PROFESSORES/{slug_email}/`
- Apenas o professor titular e a coordenação têm acesso à pasta
- `criarPastaProfessor(email)` — cria pasta e atualiza col7 na planilha
- `criarPastasParaTodosProfessores()` — batch no setup
- `moverArquivoParaPastaProfessor()` — move arquivo para pasta do professor ativo
- `listarArquivosProfessor()` — lista arquivos da pasta pessoal

---

## v2.0 — Sprint 2 (Abril 2026) — Performance e Cache

### Commit: `b26e27c`

- **CRÍTICO-03**: `getConfig()` memoizado em 3 níveis (memória → CacheService → PropertiesService)
- Cache BNCC em chunks de 60 items no CacheService (TTL 6h, contorna limite 100KB/key)
- `registrarLog()` não relê o arquivo a cada chamada

---

## v2.0 — Sprint 1 (Abril 2026) — Correções Críticas

### Commit: `b26e27c`

#### Bugs corrigidos

| ID | Descrição | Arquivo |
|----|-----------|---------|
| CRÍTICO-01 | Pastas por professor sem isolamento | `16_PastaProfessor.gs` (novo) |
| CRÍTICO-04 | `validarCodigoBNCC()` só aceitava EF | `01_Utils.gs` |
| CRÍTICO-05 | `_verificarGemini()` ignorava provider ativo | `12_Seguranca.gs` |
| CRÍTICO-06 | `gerarPEIHTML()` sem verificação de permissão | `10_MenuIA.gs` |
| BUG-01 | Comparações `estaAtivo` inconsistentes | 5 arquivos |
| BUG-04 | `addFile/removeFile` deprecated | 9 locais → `moveTo()` |
| BUG-07 | Setup usava `addFile/removeFile` | `14_SetupInicial.gs` |
| BUG-08 | Regex do Form sem âncoras `^...$` | `06_PlanoDeAula.gs` |

---

## v1.0 — Implementação Inicial

### Commit: `b26e27c`

15 módulos GAS + webapp completo:

| Arquivo | Função |
|---------|--------|
| `00_Config.gs` | Configuração central memoizada |
| `01_Utils.gs` | Utilitários (log, validação, formatação) |
| `02_BNCCService.gs` | Catálogo BNCC com cache |
| `03_DriveService.gs` | Operações no Google Drive |
| `04_SheetsService.gs` | Abstração das planilhas-mestre |
| `05_GeminiService.gs` | Gateway IA multi-provider |
| `06_PlanoDeAula.gs` | Geração de planos de aula BNCC |
| `07_BancoQuestoes.gs` | Banco de questões + provas digitais |
| `08_CorrectionEngine.gs` | Correção automática (objetivas + redações) |
| `09_Frequencia.gs` | Controle de frequência (LDBEN Art. 24) |
| `10_MenuIA.gs` | Menu + WebApp + Sidebar |
| `11_Relatorios.gs` | Relatórios pedagógicos |
| `12_Seguranca.gs` | RBAC, LGPD, auditoria, diagnóstico |
| `13_Triggers.gs` | Automações (backup, frequência, diagnóstico) |
| `14_SetupInicial.gs` | Wizard de primeiro uso |
| `15_DadosTeste.gs` | Seed de dados de teste |

---

## Estrutura de Papéis (RBAC)

```
ADMIN (4) > GESTOR (3) > COORDENADOR (2) > PROFESSOR (1) > sem acesso (0)
```

| Papel | Quem são | Cadastro |
|-------|----------|----------|
| `admin` | Administrador do sistema | `EMAILS_ADMIN` no PropertiesService |
| `gestor` | Diretores, secretaria, SEME | `EMAILS_GESTOR` |
| `coordenador` | Coordenadores pedagógicos | `EMAILS_COORDENADOR` |
| `professor` | Professores titulares | `EMAILS_PROFESSOR` ou aba Professores |

**Bootstrap:** Se `EMAILS_ADMIN` estiver vazio, use `registrarMeComoAdmin()` (ou botão na sidebar) para registrar o primeiro administrador.

---

## Planilhas-Mestre

| Planilha | Abas principais |
|----------|----------------|
| `MASTER_BNCC` | Habilidades (19 colunas v2) |
| `TURMAS_ALUNOS` | Matrículas (19 col), Turmas (8 col), Professores (11 col), Frequência |
| `BANCO_QUESTOES` | Questões (16 col), Gabaritos |
| `RESULTADOS` | Notas (12 col) |

---

*Gerado automaticamente em 2026-04-16*
