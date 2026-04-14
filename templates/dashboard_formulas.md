# Dashboard PEDAGOGO.AI — Fórmulas Google Sheets

> Referência: Bloco 7.2 do prompt mestre
> Planilha: RESULTADOS | Aba: Dashboard

## Configuração Inicial

A aba `Dashboard` deve ter as colunas:
`Turma | Componente | Bimestre | Media_Turma | Perc_Aprovados | Perc_Insuficientes | Taxa_Participacao | Habilidades_Consolidadas | Habilidades_Criticas | Data_Atualizacao`

---

## Painel 1 — Média por Turma

**Célula de referência:** Gráfico de barras por turma

```
=AVERAGEIF(Notas!C:C, A2, Notas!F:F)
```

- `Notas!C:C` = Coluna Turma
- `A2` = Código da turma na linha atual
- `Notas!F:F` = Coluna Nota_Final

**Para múltiplas turmas (array):**
```
=ARRAYFORMULA(IFERROR(AVERAGEIF(Notas!C:C, A2:A100, Notas!F:F), ""))
```

---

## Painel 2 — Distribuição de Notas (4 Faixas)

```
=COUNTIFS(Notas!F:F, ">=9", Notas!C:C, A2)    → Avançado (9-10)
=COUNTIFS(Notas!F:F, ">=7", Notas!F:F, "<9", Notas!C:C, A2)  → Adequado (7-8,9)
=COUNTIFS(Notas!F:F, ">=5", Notas!F:F, "<7", Notas!C:C, A2)  → Básico (5-6,9)
=COUNTIFS(Notas!F:F, "<5",  Notas!C:C, A2)    → Insuficiente (<5)
```

**Percentual de aprovação (≥6,0):**
```
=COUNTIFS(Notas!F:F,">=6",Notas!C:C,A2)/COUNTIF(Notas!C:C,A2)
```

---

## Painel 3 — Habilidades Críticas (Mapa de Calor)

> As habilidades críticas são gravadas na coluna `Habilidades_Criticas` (col I) da aba Notas
> separadas por ponto e vírgula.

**Contar alunos com erro em uma habilidade específica:**
```
=COUNTIF(Notas!I:I, "*" & "EF06LP05" & "*")
```

**Percentual de erro por habilidade (para heatmap):**
```
=COUNTIF(Notas!I:I,"*EF06LP05*") / COUNTA(Notas!B2:B)
```

**Lista dinâmica de habilidades mais críticas:**
```
=SORT(UNIQUE(SPLIT(TEXTJOIN(";",TRUE,FILTER(Notas!I:I,Notas!C:C=A2)),";"),TRUE,1))
```

---

## Painel 4 — Evolução Bimestral (Linha do Tempo)

```
=AVERAGEIFS(Notas!F:F, Notas!C:C, $A2, Notas!J:J, "1B_2026")
=AVERAGEIFS(Notas!F:F, Notas!C:C, $A2, Notas!J:J, "2B_2026")
=AVERAGEIFS(Notas!F:F, Notas!C:C, $A2, Notas!J:J, "3B_2026")
=AVERAGEIFS(Notas!F:F, Notas!C:C, $A2, Notas!J:J, "4B_2026")
```

- Coluna J = Bimestre

---

## Painel 5 — Risco de Evasão EJA (Semáforo)

```
=IFS(
  COUNTIFS(Frequencia!B:B, A2, Frequencia!H:H, "F") / COUNTA(Frequencia!F2:F) > 0.25, "🔴 CRÍTICO",
  AVERAGEIF(Notas!C:C, A2, Notas!F:F) < 5, "🟡 ATENÇÃO",
  TRUE, "🟢 OK"
)
```

---

## Painel 6 — KPI Frequência por Turma

```
=COUNTIFS(Frequencia!B:B, A2, Frequencia!H:H, "P") /
 COUNTA(FILTER(Frequencia!H:H, Frequencia!B:B=A2))
```

**Formatação:** Aplicar formato `0,0%` e escala de cores:
- Vermelho: < 75%
- Amarelo: 75% a 85%
- Verde: > 85%

---

## Fórmulas Auxiliares da Aba Notas

### Classificar nota em faixa:
```
=IFS(F2>=9,"Avançado", F2>=7,"Adequado", F2>=5,"Básico", TRUE,"Insuficiente")
```

### Flag de aluno em risco:
```
=IF(F2<6,"⚠️ Em Risco","✅ Aprovado")
```

### Taxa de participação:
```
=COUNTIFS(Notas!C:C, turma, Notas!E:E, prova) / VLOOKUP(turma, Turmas!A:D, 4, FALSE)
```

---

## Configurações de Formatação do Dashboard

1. **Congelar linha 1** (cabeçalhos)
2. **Formatação condicional** na coluna Média:
   - Verde: ≥ 7
   - Amarelo: ≥ 5 e < 7
   - Vermelho: < 5
3. **Validação de dados** nas colunas Turma e Bimestre (listas suspensas)
4. **Gráficos sugeridos:**
   - Barras agrupadas: médias por turma
   - Pizza: distribuição de faixas
   - Linha: evolução bimestral
