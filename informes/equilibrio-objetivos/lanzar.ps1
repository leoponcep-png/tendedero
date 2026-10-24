# Reparte una tanda en trozos y los juega en paralelo (un proceso de node por trozo).
# Uso: powershell -File lanzar.ps1 -Nombre base -Configs '<json de configs>' -Partidas 1500 -Trozos 10
param(
  [string]$Nombre,
  [string]$Configs,
  [int]$Partidas,
  [int]$Trozos = 10
)
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
$raiz = "C:\Users\Leo\Desktop\tendedero"
$dir = "$raiz\informes\equilibrio-objetivos"
New-Item -ItemType Directory -Force "$dir\tandas", "$dir\resultados" | Out-Null
Set-Location $raiz
$porTrozo = [math]::Ceiling($Partidas / $Trozos)
$procs = @()
for ($t = 0; $t -lt $Trozos; $t++) {
  $desde = $t * $porTrozo
  $n = [math]::Min($porTrozo, $Partidas - $desde)
  if ($n -le 0) { break }
  $tanda = "$dir\tandas\$Nombre-$t.json"
  "{`"partidas`":$n,`"desde`":$desde,`"configs`":$Configs}" | Out-File -Encoding ascii $tanda
  $sal = "$dir\resultados\$Nombre-$t.jsonl"
  if (Test-Path $sal) { Remove-Item $sal }
  $procs += Start-Process node -ArgumentList "`"$dir\sim-objetivos.mjs`"", "`"$tanda`"", "`"$sal`"" -NoNewWindow -PassThru -RedirectStandardOutput "$dir\tandas\$Nombre-$t.log"
}
$procs | Wait-Process
"$Nombre terminado"
