#!/usr/bin/env bash
# scripts/integration_test.sh
# Requisitos: curl, websocat, jq
# Uso: bash scripts/integration_test.sh
set -euo pipefail
API=http://localhost:3001
EScolaId=e0000000-0000-0000-0000-000000000001

echo "1) Criar serviço via admin (header x-role: admin)"
SERVICO_RESP=$(curl -s -X POST "$API/admin/servicos" -H "Content-Type: application/json" -H "x-role: admin" -H "x-escola-id: $EScolaId" -d '{"nome":"Teste Serviço","prioridade_base":0}')
echo "$SERVICO_RESP" | jq
SERVICO_ID=$(echo "$SERVICO_RESP" | jq -r '.servico.id // .id // empty')
if [ -z "$SERVICO_ID" ]; then echo "Falha a criar servico"; exit 1; fi

echo "Serviço criado: $SERVICO_ID"

# abrir um recepcionista WS para ouvir eventos (usa websocat)
echo "Abrir recepcionista WS (background)"
websocat -1 ws://localhost:3001/ws > /tmp/recep.out <<'EOF' &
{"action":"register","role":"recepcionista","escolaId":"${EScolaId}"}
EOF
RECEP_PID=$!
sleep 0.5

# criar 3 alunos via triagem
for i in 1 2 3; do
  echo "Criar ticket aluno $i"
  BODY=$(jq -n --arg s "$SERVICO_ID" --arg e "$EScolaId" --argjson r "[{\"perguntaId\":\"doc\",\"resposta\":\"sim\"}]" '{servicoId:$s,escolaId:$e,respostas:$r}')
  curl -s -X POST "$API/triagem" -H "Content-Type: application/json" -d "$BODY" | jq
  sleep 0.2
done

sleep 1

# ver fila e verificar ordenação
echo "Fila atual"
curl -s "$API/fila/$SERVICO_ID" | jq

# chamar próximo ticket
echo "Chamar próximo ticket (recepcionista)"
CHAMAR_RESP=$(curl -s -X POST "$API/recepcionista/chamar/next/$SERVICO_ID" -H "x-role: recepcionista" -H "x-escola-id: $EScolaId")
echo "$CHAMAR_RESP" | jq

# ler notificações do recepcionista (mostra últimos outputs)
echo "Últimas linhas do cliente recepcionista:" 
sleep 0.5
if [ -f /tmp/recep.out ]; then tail -n 20 /tmp/recep.out || true; fi

# cleanup
kill $RECEP_PID 2>/dev/null || true
rm -f /tmp/recep.out || true

echo "Script concluído. Verifique respostas acima." 
