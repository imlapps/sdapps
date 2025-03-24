#!/bin/bash 

set -e 

cd "$(dirname "$0")/.."


poetry run isort towndex_etl
poetry run ruff format towndex_etl