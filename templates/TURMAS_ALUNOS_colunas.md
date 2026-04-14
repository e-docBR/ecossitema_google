# Schema: Planilha TURMAS_ALUNOS

> Referência: Bloco 5.1 do prompt mestre
> Proteção LGPD: colunas marcadas com 🔒 são sensíveis, 🔑 são restritas

## Aba: Matrículas

| # | Nome da Coluna | Tipo | Obrigatório | Exemplo | LGPD |
|---|---|---|---|---|---|
| A (0) | ID_Matricula | Texto | ✅ | MAT-2026-000001 | Público |
| B (1) | Nome_Completo | Texto | ✅ | João da Silva Santos | 🔑 Restrito |
| C (2) | Data_Nascimento | Data | Sim | 15/03/2010 | 🔑 Restrito |
| D (3) | Turma | Texto | ✅ | 6A | Público |
| E (4) | Turno | Lista | ✅ | Matutino/Vespertino/Noturno | Público |
| F (5) | Segmento | Lista | ✅ | EF I/EF II/EJA Seg.I/EJA Seg.II/EM | Público |
| G (6) | Responsavel | Texto | Não | Maria da Silva | 🔑 Restrito |
| H (7) | Contato_WhatsApp | Texto | Não | (73) 9 9999-9999 | 🔑 Restrito |
| I (8) | Email_Responsavel | Texto | Não | maria@email.com | 🔑 Restrito |
| J (9) | Possui_NEE | Lista | ✅ | Sim/Não | Público |
| K (10) | Tipo_NEE | Texto | Condicional | TEA, DI, DA, DF, TDAH, Altas_Habilidades | 🔒 SENSÍVEL |
| L (11) | Laudo_Medico | Lista | Não | Sim/Não (NUNCA armazenar o laudo!) | 🔒 SENSÍVEL |
| M (12) | Requer_PEI | Lista | Condicional | Sim/Não | 🔒 SENSÍVEL |
| N (13) | Observacoes_Pedagogicas | Texto Longo | Não | Texto livre | 🔑 Restrito |
| O (14) | Status | Lista | ✅ | Ativo/Transferido/Evadido/Concluinte | Público |
| P (15) | Faixa_Etaria_EJA | Lista | EJA | 15-17/18-25/26-40/41-60/60+ | 🔑 Restrito |
| Q (16) | Escolaridade_Anterior_EJA | Lista | EJA | Nunca_Estudou/Interrompeu_EF1/Interrompeu_EF2/Interrompeu_EM | 🔑 Restrito |
| R (17) | Motivacao_Retorno_EJA | Lista | EJA | Trabalho/Família/Sonho_Pessoal/Exigência_Empregador/Outro | 🔑 Restrito |
| S (18) | Turno_Trabalho_EJA | Lista | EJA | Manhã/Tarde/Noite/Não_Trabalha | 🔑 Restrito |

### Proteções a aplicar (SetupInicial):
- **Colunas SENSÍVEIS** (K, L, M — índices 10, 11, 12): Editável apenas por Coordenação/Direção
- **Colunas RESTRITAS** (H, I — índices 7, 8): Editável apenas por Coordenação/Secretaria

---

## Aba: Frequência

| # | Nome da Coluna | Tipo | Descrição |
|---|---|---|---|
| A (0) | Data | Data | dd/MM/yyyy — sempre timezone America/Bahia |
| B (1) | Turma | Texto | Código da turma |
| C (2) | Componente | Texto | Componente curricular |
| D (3) | Professor | E-mail | E-mail do professor que registrou |
| E (4) | Total_Aulas | Número | Calculado por fórmula |
| F (5) | ID_Matricula | Texto | Chave FK para aba Matrículas |
| G (6) | Nome_Aluno | Texto | Denormalizado para facilitar consultas |
| H (7) | Presenca | Lista | P (Presente) / F (Falta) |
| I (8) | Observacao | Texto | Campo livre para justificativas |

### Fórmulas importantes:
- **Percentual de faltas de um aluno:**
  `=COUNTIFS(H:H,"F",G:G,"[Nome]") / COUNTA(FILTER(H:H,G:G="[Nome]"))`
- **Alerta LDBEN (>25%):** formatação condicional na coluna G

---

## Aba: Turmas

| # | Nome da Coluna | Tipo | Exemplo |
|---|---|---|---|
| A (0) | Codigo_Turma | Texto | 6A, 7B, EJA_II_NOITE |
| B (1) | Nome_Turma | Texto | 6º Ano A — Vespertino |
| C (2) | Segmento | Lista | EF I/EF II/EJA Seg.I/EJA Seg.II |
| D (3) | Turno | Lista | Matutino/Vespertino/Noturno |
| E (4) | Professor_Titular | E-mail | professor@escola.edu.br |
| F (5) | Total_Alunos | Fórmula | =COUNTIF(Matrículas!D:D, A2) |
| G (6) | Ano_Letivo | Número | 2026 |
| H (7) | Ativa | Booleano | TRUE/FALSE |
