#!/usr/bin/env bash
# Juega una tanda del torneo repartida en trozos, un proceso de node por trozo (desde la raíz del proyecto).
# Uso: bash informes/ia-dificultad/lanzar.sh nombre '<duelos en JSON>' partidas trozos
set -e
nombre=$1; duelos=$2; partidas=$3; trozos=${4:-6}
dir=informes/ia-dificultad
mkdir -p $dir/tandas $dir/resultados
por=$(( (partidas + trozos - 1) / trozos ))
for ((t=0; t<trozos; t++)); do
  desde=$(( t * por )); n=$(( partidas - desde < por ? partidas - desde : por ))
  (( n > 0 )) || break
  echo "{\"partidas\":$n,\"desde\":$desde,\"duelos\":$duelos}" > $dir/tandas/$nombre-$t.json
  rm -f $dir/resultados/$nombre-$t.jsonl
  node $dir/torneo.mjs $dir/tandas/$nombre-$t.json $dir/resultados/$nombre-$t.jsonl > $dir/tandas/$nombre-$t.log &
done
wait
node $dir/resumen.mjs $dir/resultados/$nombre-*.jsonl
cat $dir/tandas/$nombre-*.log | grep "ms por"
