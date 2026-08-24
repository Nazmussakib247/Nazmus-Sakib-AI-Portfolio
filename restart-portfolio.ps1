$portfolioProcesses = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*D:\03_Porfolio*' -and $_.Name -match '^(node|pnpm|pnpm\.cmd)' }
foreach ($process in $portfolioProcesses) {
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
$log = 'D:\03_Porfolio\dev-server.log'
$err = 'D:\03_Porfolio\dev-server-error.log'
Start-Process -FilePath 'pnpm.cmd' -ArgumentList 'run','dev' -WorkingDirectory 'D:\03_Porfolio' -RedirectStandardOutput $log -RedirectStandardError $err -WindowStyle Hidden
Start-Sleep -Seconds 5
$listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
Write-Output ('port3000=' + [bool]$listener)
