#!/bin/bash 

set -e 

cd "$(dirname "$0")/.."


poetry run isort etl
poetry run ruff format etl