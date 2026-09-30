"""Seed demo users + baseline org data (idempotent).

Wrapper around the repository-root seeder so both entry points work:
    python seed_backend_users.py        (root, historical)
    python scripts/seed.py              (structured layout)
"""
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

runpy.run_path(str(ROOT / "seed_backend_users.py"), run_name="__main__")
