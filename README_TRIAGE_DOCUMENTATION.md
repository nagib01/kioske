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

## 📖 Ficheiros de Documentação (Criados)

### 1. `TRIAGE_ENGINE_REFACTORED.md`
**Status**: ✅ **NOVO**

**Conteúdo:**
- Resumo das mudanças
- O que foi removido (hardcoding)
- O que foi adicionado (flexibilidade)
- Exemplo: Criando regras JSON
- Estrutura de dados (tipos TypeScript)
- Fluxo de processamento
- Ficheiros modificados
- Notas importantes
- Próximos passos

**Quando ler:** **PRIMEIRO** - Para entender o contexto geral

**Tempo de leitura**: ~5 minutos

---

### 2. `TRIAGE_RULES_GUIDE.md`
**Status**: ✅ **NOVO**

**Conteúdo:**
- Conceitos fundamentais (Trigger, Effects)
- 5 padrões de regras comuns
- 4 exemplos por cenário (Saúde, Agendamento, Educação, Empresarial)
- Validação e testes
- Boas práticas (Do's e Don'ts)
- Suporte e debug

**Quando ler:** Quando criar ou modificar regras JSON

**Tempo de leitura**: ~15 minutos

**Usar como**: Referência ao estruturar novas regras

---

### 3. `TRIAGE_FLOW_DIAGRAM.md`
**Status**: ✅ **NOVO**

**Conteúdo:**
- Fluxo visual em ASCII
- Exemplo prático: Triagem cardíaca
- Lógica de combinação (múltiplas regras)
- Antes vs Depois (hardcoding vs regras)
- Testes casos especiais
- Performance
- Validações necessárias

**Quando ler:** Para entender visualmente como o motor funciona

**Tempo de leitura**: ~10 minutos

**Usar como**: Explicação para stakeholders

---

## 💻 Ficheiros de Código (Criados)

### 1. `backend/services/TriagemEngine.examples.ts`
**Status**: ✅ **NOVO**

**Conteúdo:**
- 6 exemplos práticos de uso do motor
- Casos de teste unitários
- SQL para inserir dados na BD
- Exemplos de curl para testar via API

**Quando usar:**
- Referência ao escrever testes
- Entender como chamar `TriagemEngine.processar()`
- Visualizar diferentes cenários

**Executar como:**
```bash
# Não é executado diretamente - usar como referência
# Copiar exemplos SQL para testes
```

---

### 2. `TEST_TRIAGE_ENGINE.sql`
**Status**: ✅ **NOVO**

**Conteúdo:**
- 5 exemplos de perguntas com regras completas
  1. Urgência médica
  2. Validação de documentação
  3. Sintomas críticos (múltiplos valores)
  4. Alerta incondicional
  5. Combinação complexa
- Inserção de todas as perguntas
- Inserção de todas as opções
- Queries de validação
- Exemplos de curl
- Script de limpeza (optional)

**Quando usar:**
```bash
# Para inserir dados de teste na BD:
psql -U seu_usuario -d sua_db -f TEST_TRIAGE_ENGINE.sql

# Ou copiar e colar os inserts no seu cliente SQL
```

**Resultado esperado:**
- 5 novas perguntas criadas
- ~40 novas opções criadas
- Todas com regras JSON válidas

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

## 📊 Mapa Visual de Dependências

```
INÍCIO: Ler TRIAGE_ENGINE_REFACTORED.md
   ↓
ENTENDER: Ler TRIAGE_FLOW_DIAGRAM.md
   ↓
PREPARAR: Executar TEST_TRIAGE_ENGINE.sql
   ↓
TESTAR: Usar TriagemEngine.examples.ts como referência
   ↓
CRIAR REGRAS: Usar TRIAGE_RULES_GUIDE.md
   ↓
IMPLEMENTAR: Seguir IMPLEMENTATION_CHECKLIST.md
   ↓
VALIDAR: Usar queries de TEST_TRIAGE_ENGINE.sql
   ↓
MONITORAR: Referência em IMPLEMENTATION_CHECKLIST.md Fase 6
```

---

## 🎯 Leitura Recomendada por Perfil

### Para Desenvolvedores

1. **Dia 1**
   - [ ] Ler `TRIAGE_ENGINE_REFACTORED.md` (5 min)
   - [ ] Ler `TRIAGE_FLOW_DIAGRAM.md` (10 min)
   - [ ] Revisar `TriagemEngine.ts` (10 min)

2. **Dia 2**
   - [ ] Executar `TEST_TRIAGE_ENGINE.sql` (5 min)
   - [ ] Testar endpoints (10 min)
   - [ ] Criar testes unitários (30 min)

3. **Dia 3**
   - [ ] Seguir `IMPLEMENTATION_CHECKLIST.md` (variável)
   - [ ] Completar todas as fases (2-4 horas)

---

### Para Administradores/Product Owners

1. **Visão Geral**
   - [ ] Ler `TRIAGE_ENGINE_REFACTORED.md` (5 min)
   - [ ] Ver diagramas em `TRIAGE_FLOW_DIAGRAM.md` (5 min)

2. **Criação de Regras**
   - [ ] Ler `TRIAGE_RULES_GUIDE.md` (15 min)
   - [ ] Copiar exemplos de `TEST_TRIAGE_ENGINE.sql` (10 min)
   - [ ] Adaptar regras para seu caso (variável)

3. **Monitoramento**
   - [ ] Revisar Fase 6 de `IMPLEMENTATION_CHECKLIST.md` (5 min)
   - [ ] Configurar alertas (variável)

---

### Para QA/Testing

1. **Preparação**
   - [ ] Ler `IMPLEMENTATION_CHECKLIST.md` Fase 3 e 4 (20 min)
   - [ ] Ler `TriagemEngine.examples.ts` (10 min)

2. **Testes**
   - [ ] Executar testes unitários de referência (30 min)
   - [ ] Executar testes de integração de referência (30 min)
   - [ ] Validar com dados reais (1+ hora)

3. **Documentação**
   - [ ] Usar exemplos como base para cenários de teste
   - [ ] Documentar casos encontrados

---

## 🔄 Fluxo de Trabalho Típico

### Implementação Inicial (Onboarding)

```
1. Clonar repositório
   ↓
2. Ler TRIAGE_ENGINE_REFACTORED.md
   ↓
3. Executar TEST_TRIAGE_ENGINE.sql
   ↓
4. Testar endpoint com curl
   ↓
5. Executar testes (Fase 3-4 do checklist)
   ↓
6. Validar em ambiente de teste
   ↓
7. Passar para produção
```

### Criação de Novas Regras

```
1. Entender necessidade do negócio
   ↓
2. Desenhar regras (usar TRIAGE_RULES_GUIDE.md como referência)
   ↓
3. Escrever JSON das regras
   ↓
4. Validar JSON (usar jsonlint.com)
   ↓
5. Inserir na BD (INSERT SQL ou admin UI)
   ↓
6. Testar com curl (usar TEST_TRIAGE_ENGINE.sql como template)
   ↓
7. Validar resultado no ticket criado
   ↓
8. Monitorar em produção
```

### Debugging de Problemas

```
1. Problema identificado
   ↓
2. Reproduzir com curl/API
   ↓
3. Verificar regras na BD (SELECT * FROM triage_questions)
   ↓
4. Validar JSON (usar TRIAGE_RULES_GUIDE.md)
   ↓
5. Usar exemplos de TriagemEngine.examples.ts para comparar
   ↓
6. Adicionar console.log() no engine se necessário
   ↓
7. Corrigir regra ou código
   ↓
8. Testar novamente
```

---

## 📦 Checklist de Ficheiros

### Código
- [x] `backend/services/TriagemEngine.ts` - Modificado
- [x] `backend/services/api/triagem.ts` - Modificado

### Documentação
- [x] `TRIAGE_ENGINE_REFACTORED.md`
- [x] `TRIAGE_RULES_GUIDE.md`
- [x] `TRIAGE_FLOW_DIAGRAM.md`
- [x] `IMPLEMENTATION_CHECKLIST.md`
- [x] `README_TRIAGE_DOCUMENTATION.md` (este ficheiro)

### Exemplos e Testes
- [x] `backend/services/TriagemEngine.examples.ts`
- [x] `TEST_TRIAGE_ENGINE.sql`

---

## 🚀 Próximos Passos

1. **Imediatamente**
   - Ler `TRIAGE_ENGINE_REFACTORED.md`
   - Revisar mudanças no código

2. **Dentro de 1 dia**
   - Executar `TEST_TRIAGE_ENGINE.sql`
   - Testar endpoints
   - Completar testes unitários (Fase 3)

3. **Dentro de 1 semana**
   - Completar `IMPLEMENTATION_CHECKLIST.md`
   - Validar com dados reais
   - Passar para staging

4. **Dentro de 2 semanas**
   - Deploy em produção
   - Monitorar comportamento
   - Recolher feedback

---

## 💡 Dicas Rápidas

### Como testar rapidamente
```bash
# 1. Inserir dados de teste
psql -U seu_usuario -d sua_db -f TEST_TRIAGE_ENGINE.sql

# 2. Testar um caso
curl -X POST http://localhost:3000/api/triagem \
  -H "Content-Type: application/json" \
  -d '{
    "servicoId": "seu-uuid",
    "escolaId": "seu-uuid",
    "respostas": [{"perguntaId": "q-urgencia", "resposta": "emergencia"}]
  }'

# 3. Verificar resultado na BD
SELECT * FROM tickets ORDER BY created_at DESC LIMIT 1;
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

1. Verifique a documentação relevante acima
2. Procure exemplos em `TriagemEngine.examples.ts`
3. Use as queries de validação em `TEST_TRIAGE_ENGINE.sql`
4. Reveja `TRIAGE_RULES_GUIDE.md` para boas práticas

---

**Versão**: 1.0  
**Data**: Maio 2026  
**Status**: ✅ Completo e Pronto para Uso
