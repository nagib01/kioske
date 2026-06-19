# 📚 Documentação da Refatorização do TriagemEngine

## 📍 Índice de Ficheiros

Este documento mapeia todos os ficheiros criados e modificados durante a refatorização do **TriagemEngine** para ser **100% baseado em regras JSON**.

---

## 🔧 Ficheiros Modificados

### 1. `backend/services/TriagemEngine.ts`
**Status**: ✅ **MODIFICADO**

**O que mudou:**
- ❌ Removida toda a lógica hardcoded
- ❌ Removidos métodos `normalize()` e `asBoolean()`
- ❌ Removidas condições baseadas em `chave`
- ❌ Removidas verificações de padrões textuais
- ✅ Novo motor 100% baseado em regras JSON
- ✅ Nova assinatura: `processar(respostas, perguntas)`
- ✅ Sem parâmetro `servicoNome`

**Tamanho**: ~170 linhas (antes: ~140 linhas)

**Usar quando:** Toda a lógica de triagem (prioridades, alertas, validações)

---

### 2. `backend/services/api/triagem.ts`
**Status**: ✅ **MODIFICADO**

**O que mudou:**
- ✅ Adaptada chamada a `TriagemEngine.processar()` para nova assinatura
- ✅ Removido parâmetro `servicoNome` desnecessário
- ✅ Garantido que perguntas com regras são carregadas da BD

**Tamanho**: Sem mudanças estruturais (apenas 1 linha de chamada)

**Usar quando:** Endpoint `/api/triagem` para criar tickets

---

## 📖 Documentação no Código

A documentação do motor de triagem está nos próprios ficheiros de código:

- **`backend/services/TriagemEngine.ts`** — JSDoc completo com tipos, fluxo, exemplos de regras JSON e parâmetros
- **`backend/services/TriagemEngine.test.ts`** — 9 testes unitários que documentam casos de uso (trigger.equals, trigger.in, alertas, prioridades)
- **`backend/services/api/triagem.ts`** — Endpoints da API de triagem com exemplos de payload
- **`backend/src/db/seed-triage.sql`** — 8 perguntas de exemplo com regras JSON

---

## 💻 Ficheiros de Código

- **`backend/services/TriagemEngine.ts`** — Motor de triagem rule-based (167 linhas)
- **`backend/services/TriagemEngine.test.ts`** — 9 testes unitários
- **`backend/src/db/seed-triage.sql`** — Seed de exemplo (8 perguntas, 20 opções com regras JSON)

---

## ✅ Ficheiros de Checklist e Planeamento

### 1. `IMPLEMENTATION_CHECKLIST.md`
**Status**: ✅ **NOVO**

**Conteúdo:**
- 8 fases de implementação
- Checklist detalhado para cada fase:
  1. Validação do código
  2. Preparação BD
  3. Testes unitários (8 testes)
  4. Testes de integração (4 testes)
  5. Validação de dados reais
  6. Monitoramento em produção
  7. Documentação
  8. Pós-refatorização

**Quando usar:**
- **PRINCIPAL**: Guia para implementar tudo
- Acompanhamento de progresso
- Validação de cada fase

**Como usar:**
```
[ ] Marcar cada item conforme completar
[ ] Seguir as fases em ordem
[ ] Não pular fases
```

---

## 📊 Mapa de Dependências

```
1. LER: backend/services/TriagemEngine.ts (JSDoc + tipos)
   ↓
2. CRIAR/ALTERAR REGRAS: backend/src/db/seed-triage.sql (exemplos)
   ↓
3. TESTAR: npm test (backend)
   ↓
4. VALIDAR UI: http://localhost:3000/admin/questionarios
   ↓
5. CRIAR REGRAS: Coluna regras (JSONB) em triage_questions / triage_question_options
```

---

## 🎯 Leitura Recomendada por Perfil

### Para Desenvolvedores

1. **Dia 1**
   - [ ] Revisar `backend/services/TriagemEngine.ts` (10 min)
   - [ ] Revisar `backend/services/api/triagem.ts` (10 min)

2. **Dia 2**
   - [ ] Executar `backend/src/db/seed-triage.sql` (5 min)
   - [ ] Testar endpoints (10 min)
   - [ ] Executar `npm test` para validar (1 min)

3. **Dia 3**
   - [ ] Criar novas perguntas via UI em `/admin/questionarios`
   - [ ] Adicionar regras JSON nas opções

---

### Para Administradores/Product Owners

1. **Visão Geral**
   - [ ] Aceder a `/admin/questionarios` para gerir perguntas
   - [ ] Ver seed data em `backend/src/db/seed-triage.sql`

2. **Criação de Regras**
   - [ ] Usar UI Admin para criar perguntas e opções
   - [ ] Adicionar regras JSON nas opções (priority_level, alerta)

---

### Para QA/Testing

1. **Preparação**
   - [ ] Executar `npm test` no backend (9 testes TriagemEngine)
   - [ ] Testar UI em `/admin/questionarios`

2. **Testes**
   - [ ] Validar criação de ticket com triagem via `/aluno`
   - [ ] Verificar priority_level e alertas no backoffice `/backoffice`

---

## 🔄 Fluxo de Trabalho Típico

### Implementação Inicial (Onboarding)

```
1. Clonar repositório
   ↓
2. npm run db:setup (criar schema + seed)
   ↓
3. npm run dev
   ↓
4. Aceder a http://localhost:3000/admin/questionarios
   ↓
5. npm test (validar motor de triagem)
   ↓
6. Testar fluxo completo em /aluno + /backoffice
```

### Criação de Novas Regras

```
1. Entender necessidade do negócio
   ↓
2. Aceder a /admin/questionarios
   ↓
3. Criar pergunta com opções
   ↓
4. Adicionar regra JSON na opção (ex: {"priority_level": 2, "alerta": "urgencia"})
   ↓
5. Testar via /aluno (selecionar serviço → responder → verificar prioridade)
   ↓
6. Validar resultado no backoffice (/backoffice)
```

### Debugging de Problemas

```
1. Problema identificado
   ↓
2. Verificar regras: SELECT * FROM triage_question_options WHERE regra != '{}'
   ↓
3. Testar com TriagemEngine.test.ts como referência
   ↓
4. Verificar logs do backend
   ↓
5. Corrigir regra ou código
```

---

## 📦 Checklist de Ficheiros

### Código
- [x] `backend/services/TriagemEngine.ts` - Motor de triagem rule-based
- [x] `backend/services/TriagemEngine.test.ts` - 9 testes unitários
- [x] `backend/services/api/triagem.ts` - Endpoints de triagem
- [x] `backend/services/api/admin.ts` - CRUD perguntas/opções
- [x] `frontend/src/pages/admin/questionarios.tsx` - UI Admin

### Documentação
- [x] `backend/services/TriagemEngine.ts` (JSDoc inline)
- [x] `README_TRIAGE_DOCUMENTATION.md` (este ficheiro)

### Dados
- [x] `backend/src/db/seed-triage.sql` - 8 perguntas, 20 opções

---

## 🚀 Próximos Passos

1. **Imediatamente**
   - Revisar `backend/services/TriagemEngine.ts`
   - Executar `npm test` no backend

2. **Dentro de 1 dia**
   - Aplicar schema + seed (`npm run db:setup`)
   - Testar endpoints via UI (`/admin/questionarios`, `/aluno`)

3. **Dentro de 1 semana**
   - Validar com dados reais (criar perguntas personalizadas)
   - Passar para staging

4. **Dentro de 2 semanas**
   - Deploy em produção
   - Monitorar comportamento

---

## 💡 Dicas Rápidas

### Como testar rapidamente
```bash
# 1. Inserir dados de teste
npm run db:seed-triage

# 2. Testar endpoints via curl
curl -X POST http://localhost:3001/api/triagem/finalizar \
  -H "Content-Type: application/json" \
  -d '{"servicoId": 1, "escolaId": 1, "respostas": []}'

# 3. Verificar resultado
curl http://localhost:3001/api/fila
```

### Como validar regras
```sql
-- Verificar sintaxe JSON
SELECT chave, jsonb_typeof(regras) FROM triage_questions;

-- Ver regras formatadas
SELECT jsonb_pretty(regras) FROM triage_questions WHERE chave = 'urgencia_medica';
```

### Como debugar no código
```typescript
// Adicionar ao TriagemEngine.processar()
console.log('Processando respostas:', respostas);
console.log('Com perguntas:', perguntas);
console.log('Resultado:', resultado);
```

---

## 📞 Suporte

Se tiver dúvidas:

1. Reveja `backend/services/TriagemEngine.ts` (JSDoc completo)
2. Execute `npm test` no backend para validar regras
3. Verifique a BD: `SELECT * FROM triage_question_options WHERE regra != '{}'`

---

**Versão**: 1.0  
**Data**: Maio 2026  
**Status**: ✅ Completo e Pronto para Uso
