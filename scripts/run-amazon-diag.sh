#!/usr/bin/env bash
set -e
python3 scripts/diag_query.py
python3 scripts/save_diag.py
