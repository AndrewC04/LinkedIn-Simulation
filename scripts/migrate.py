"""
scripts/migrate.py
Run this once after pulling if your DB is already initialized.
Safe to run multiple times — skips columns that already exist.

Usage:
    python scripts/migrate.py
"""
import pymysql

conn = pymysql.connect(
    host="127.0.0.1",
    port=3307,
    user="appuser",
    password="apppassword",
    database="linkedin_db",
)

MIGRATIONS = [
    ("members", "banner_photo_url", "ALTER TABLE members ADD COLUMN banner_photo_url VARCHAR(500)"),
]

with conn:
    with conn.cursor() as cur:
        cur.execute("SELECT DATABASE()")
        for table, column, sql in MIGRATIONS:
            cur.execute(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
                (table, column),
            )
            exists = cur.fetchone()[0]
            if exists:
                print(f"  skip  {table}.{column} (already exists)")
            else:
                cur.execute(sql)
                conn.commit()
                print(f"  added {table}.{column}")

print("Done.")
