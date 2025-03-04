#!/bin/bash

set -e

cd "$(dirname "$0")"

format_rdf() {
  rapper -i turtle -o turtle -q $1 >temp.ttl
  mv -f temp.ttl $1
}

format_rdf $PWD/models.shaclmate.ttl

../../../shaclmate/packages/cli/cli.sh generate "$PWD/models.shaclmate.ttl" >src/generated.ts

npm exec biome -- check --write --unsafe src/generated.ts
