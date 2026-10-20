"""Apply console_setup.sql to the Supabase project configured in the root .env.

Install the optional driver with `python -m pip install "psycopg[binary]"`, then
run this file from any working directory with Python. If direct database access
is unavailable, set DATABASE_HOST, DATABASE_PORT, and DATABASE_USER in the root
.env to the Supavisor/session-pooler connection values from Supabase.
"""

from pathlib import Path
import re
import sys
from urllib.parse import urlparse

import psycopg


ROOT = Path(__file__).resolve().parents[1]


def read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$", line)
        if match:
            value = match.group(2)
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            values[match.group(1)] = value
    return values


def main() -> int:
    env = read_env(ROOT / ".env")
    project_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    database_password = env.get("DATABASE_PASSWORD", "")
    hostname = urlparse(project_url).hostname or ""
    project_ref = hostname.removesuffix(".supabase.co")
    database_host = env.get("DATABASE_HOST", f"db.{project_ref}.supabase.co")
    database_port = int(env.get("DATABASE_PORT", "5432"))
    database_user = env.get("DATABASE_USER", "postgres")
    if not project_ref or hostname != f"{project_ref}.supabase.co" or not database_password:
        print("Root .env must define NEXT_PUBLIC_SUPABASE_URL and DATABASE_PASSWORD.", file=sys.stderr)
        return 2

    sql_path = ROOT / "supabase" / "console_setup.sql"
    sql = sql_path.read_text(encoding="utf-8")
    try:
        with psycopg.connect(
            host=database_host,
            port=database_port,
            dbname="postgres",
            user=database_user,
            password=database_password,
            sslmode="require",
            connect_timeout=20,
        ) as connection:
            connection.execute(sql, prepare=False)
        print("Supabase schema and policies applied successfully.")
        return 0
    except Exception as error:
        # Avoid printing connection details or credentials.
        print(f"Supabase schema application failed ({type(error).__name__}).", file=sys.stderr)
        detail = str(error).replace(database_password, "[redacted]")
        if detail:
            print(detail, file=sys.stderr)
        print("Check database connectivity, the database password, and SQL permissions.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
