<#
.SYNOPSIS
  Integration test for Kioske Digital.
  Full flow: kiosk token -> create ticket -> queue -> call -> finalize.
  Requires: curl.exe (ships with Windows 10/11)
  Usage:    powershell -File scripts\integration_test.ps1
#>

$API = "http://localhost:3001"
$tmpDir = "$env:TEMP\kioske_inttest"
$null = New-Item -ItemType Directory -Path $tmpDir -Force

Write-Host "=== Kioske Digital - Integration Test ===" -ForegroundColor Cyan
$err = $false

function Check($msg, $cond) {
    if ($cond) { Write-Host "  OK $msg" -ForegroundColor Green }
    else       { Write-Host "  FAIL $msg" -ForegroundColor Red; $script:err = $true }
}

# 1. Kiosk token
Write-Host "`n[1] Get kiosk token" -ForegroundColor Yellow
$r = curl.exe -s "$API/api/kiosk/token"
$tk = ($r | ConvertFrom-Json).token
Check "token=$tk" ($tk -ne $null)

# 2. Services
Write-Host "`n[2] Fetch services" -ForegroundColor Yellow
$r = curl.exe -s "$API/api/servicos?escolaId=1"
$sv = $r | ConvertFrom-Json
Check "$($sv.Count) services" ($sv.Count -gt 0)
$svId = $sv[0].id

# 3. Create ticket
Write-Host "`n[3] Create ticket" -ForegroundColor Yellow
@{ servicoId=$svId; respostas=@(); kioskToken=$tk; escolaId=1 } | ConvertTo-Json |
    Set-Content -Path "$tmpDir\body.json" -Encoding ascii
$r = curl.exe -s -X POST "$API/api/triagem/finalizar" -H "Content-Type: application/json" -d "@$tmpDir\body.json"
$t = ($r | ConvertFrom-Json).ticket
Check "ticket $($t.codigo_senha) (id=$($t.id))" ($t -ne $null)

# 4. Queue
Write-Host "`n[4] Verify in queue" -ForegroundColor Yellow
$r = curl.exe -s "$API/api/fila?escolaId=1"
$q = $r | ConvertFrom-Json
$found = $q | Where-Object { $_.id -eq $t.id -and $_.estado -eq 'waiting' }
Check "position $($found.posicao_fila)" ($found -ne $null)

# 5. Login
Write-Host "`n[5] Login as recepcionista" -ForegroundColor Yellow
@{ email="maria.silva@escola.com"; senha="admin123" } | ConvertTo-Json |
    Set-Content -Path "$tmpDir\login.json" -Encoding ascii
$r = curl.exe -s -X POST "$API/api/login" -H "Content-Type: application/json" -d "@$tmpDir\login.json"
$lr = $r | ConvertFrom-Json
Check "$($lr.nome) ($($lr.role))" ($lr.token -ne $null)
$token = $lr.token

# 6. Call next
Write-Host "`n[6] Call next" -ForegroundColor Yellow
@{ mesa="01" } | ConvertTo-Json | Set-Content -Path "$tmpDir\call.json" -Encoding ascii
$r = curl.exe -s -X POST "$API/api/recepcionista/chamar/next/$svId" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "@$tmpDir\call.json"
$cr = $r | ConvertFrom-Json
Check "called $($cr.ticket.codigo_senha) -> mesa $($cr.ticket.mesa_atendimento)" ($cr.ticket -ne $null)

# 7. Verify called state
Write-Host "`n[7] Verify called state" -ForegroundColor Yellow
$r = curl.exe -s "$API/api/fila?escolaId=1"
$q2 = $r | ConvertFrom-Json
$called = $q2 | Where-Object { $_.id -eq $cr.ticket.id -and $_.estado -eq 'called' }
Check "confirmed" ($called -ne $null)

# 8. Finalize
Write-Host "`n[8] Finalize (cleanup)" -ForegroundColor Yellow
$r = curl.exe -s -X POST "$API/api/recepcionista/finalizar/$($cr.ticket.id)" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "@$tmpDir\call.json"
$fr = $r | ConvertFrom-Json
Check "finalized" ($fr.ticket.estado -eq 'finished')

# Cleanup
Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`n=== $(if ($err) { 'SOME TESTS FAILED' } else { 'ALL TESTS PASSED' }) ===" -ForegroundColor $(if ($err) { 'Red' } else { 'Cyan' })
if ($err) { exit 1 }
