#!/usr/bin/env bash
# Juega la tanda del informe repartida en trozos (un node por trozo). Desde la raíz del proyecto (o de la copia con
# las reglas de antes). Uso: bash informes/humedad/lanzar.sh nombre partidas trozos
set -e
nombre=$1; partidas=${2:-150}; trozos=${3:-5}
dir=informes/humedad
duelos='[
 {"id":"dificil-normal","niveles":["dificil","normal"],"modo":"normal"},
 {"id":"normal-facil","niveles":["normal","facil"],"modo":"normal"},
 {"id":"dificil-facil","niveles":["dificil","facil"],"modo":"normal"},
 {"id":"tres-niveles","niveles":["dificil","normal","facil"],"modo":"normal"},
 {"id":"larga-dificil-normal","niveles":["dificil","normal"],"modo":"larga"},
 {"id":"larga-tres-niveles","niveles":["dificil","normal","facil"],"modo":"larga"}
]'
mkdir -p $dir/tandas $dir/resultados
por=$(( (partidas + trozos - 1) / trozos ))
for ((t=0; t<trozos; t++)); do
  desde=$(( t * por )); n=$(( partidas - desde < por ? partidas - desde : por ))
  (( n > 0 )) || break
  echo "{\"partidas\":$n,\"desde\":$desde,\"duelos\":$duelos}" > $dir/tandas/$nombre-$t.json
  rm -f $dir/resultados/$nombre-$t.jsonl
  node $dir/sim.mjs $dir/tandas/$nombre-$t.json $dir/resultados/$nombre-$t.jsonl > $dir/tandas/$nombre-$t.log &
done
wait
