#!/bin/bash 

set -e

cd "$(dirname "$0")/.."

poetry run ruff format --check towndex_etl
poetry run mypy towndex_etl
poetry run ruff check towndex_etl


mkdir -p test-results
poetry run pytest --cov=towndex_etl --cov-report=term-missing:skip-covered --junitxml=test-results/junit.xml -p no:warnings towndex_etl_tests| tee test-results/coverage.txt