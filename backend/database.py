import sqlite3
import json
import logging
from typing import Any, Dict, List, Optional
from config import settings
from seeds.initial_data import (
    SERVICES_CATALOG, APPOINTMENTS, SERVICE_JOBS,
    EMPLOYEES, PAYROLL, PARTS, INVOICES, NOTIFICATIONS,
    REVENUE_DATA, SERVICES_REVENUE
)

logger = logging.getLogger("autocare.database")
logging.basicConfig(level=logging.INFO)

class DatabaseManager:
    def __init__(self):
        self.engine: str = "sqlite"
        self.is_connected: bool = False
        self.pg_conn = None
        self._init_database()

    def _init_database(self):
        """Initialize PostgreSQL if configured and accessible, otherwise fallback to SQLite."""
        if settings.USE_POSTGRES:
            try:
                import psycopg
                logger.info(f"Attempting PostgreSQL connection: {settings.DATABASE_URL}")
                self.pg_conn = psycopg.connect(settings.DATABASE_URL, autocommit=True)
                self.engine = "postgresql"
                self.is_connected = True
                logger.info("[DB] Connected to PostgreSQL successfully.")
                self._apply_postgres_schema()
                return
            except Exception as e:
                logger.warning(f"[DB] PostgreSQL unavailable ({e}). Falling back to SQLite local database.")

        # Fallback SQLite Engine
        self.engine = "sqlite"
        self.is_connected = True
        logger.info(f"[DB] Initializing SQLite local database at {settings.SQLITE_DB_PATH}")
        self._init_sqlite()

    def _apply_postgres_schema(self):
        """Executes database/schema.sql on PostgreSQL if tables are absent."""
        if not settings.SCHEMA_SQL_PATH.exists():
            logger.warning(f"Schema file not found at {settings.SCHEMA_SQL_PATH}")
            return
        try:
            with open(settings.SCHEMA_SQL_PATH, "r", encoding="utf-8") as f:
                sql_content = f.read()
            with self.pg_conn.cursor() as cur:
                cur.execute("SELECT to_regclass('core.services');")
                exists = cur.fetchone()[0]
                if not exists:
                    logger.info("[DB] Applying database/schema.sql to PostgreSQL...")
                    cur.execute(sql_content)
                    logger.info("[DB] Schema applied successfully.")
        except Exception as e:
            logger.error(f"[DB] Error applying PostgreSQL schema: {e}")

    def _get_sqlite_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(settings.SQLITE_DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        """Initializes tables in SQLite and populates seed data if empty."""
        conn = self._get_sqlite_connection()
        cur = conn.cursor()

        # 1. Services table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price REAL NOT NULL,
                duration INTEGER NOT NULL,
                desc TEXT,
                is_active INTEGER DEFAULT 1
            )
        """)
        try:
            cur.execute("ALTER TABLE services ADD COLUMN is_active INTEGER DEFAULT 1")
        except Exception:
            pass

        # 2. Appointments table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id TEXT PRIMARY KEY,
                customer TEXT NOT NULL,
                vehicle TEXT NOT NULL,
                plate TEXT NOT NULL,
                service TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                status TEXT NOT NULL,
                tech TEXT,
                est INTEGER NOT NULL,
                cost REAL NOT NULL,
                notes TEXT,
                phone TEXT,
                email TEXT
            )
        """)
        try:
            cur.execute("ALTER TABLE appointments ADD COLUMN phone TEXT")
        except Exception:
            pass
        try:
            cur.execute("ALTER TABLE appointments ADD COLUMN email TEXT")
        except Exception:
            pass

        # 3. Service Jobs table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS service_jobs (
                id TEXT PRIMARY KEY,
                appt TEXT,
                vehicle TEXT NOT NULL,
                plate TEXT NOT NULL,
                customer TEXT NOT NULL,
                service TEXT NOT NULL,
                tech TEXT,
                status TEXT NOT NULL,
                start TEXT,
                mileage INTEGER DEFAULT 0,
                labor REAL DEFAULT 0,
                parts REAL DEFAULT 0,
                total REAL DEFAULT 0,
                services_json TEXT,
                parts_json TEXT
            )
        """)
        try:
            cur.execute("ALTER TABLE service_jobs ADD COLUMN services_json TEXT")
        except Exception:
            pass
        try:
            cur.execute("ALTER TABLE service_jobs ADD COLUMN parts_json TEXT")
        except Exception:
            pass

        # 4. Employees table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                dept TEXT NOT NULL,
                type TEXT NOT NULL,
                salary REAL NOT NULL,
                hire TEXT NOT NULL,
                status TEXT NOT NULL,
                phone TEXT,
                email TEXT
            )
        """)

        # 5. Payroll table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS payroll (
                id TEXT PRIMARY KEY,
                employee TEXT NOT NULL,
                name TEXT NOT NULL,
                period TEXT NOT NULL,
                basic REAL NOT NULL,
                overtime REAL NOT NULL,
                otRate REAL NOT NULL,
                allowances REAL NOT NULL,
                deductions REAL NOT NULL,
                status TEXT NOT NULL
            )
        """)

        # 6. Parts / Inventory table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS parts (
                id INTEGER PRIMARY KEY,
                partNo TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                stock INTEGER NOT NULL,
                reorder INTEGER NOT NULL,
                unit TEXT NOT NULL,
                cost REAL NOT NULL,
                price REAL NOT NULL,
                supplier TEXT NOT NULL
            )
        """)

        # 7. Invoices table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                invoiceNo TEXT NOT NULL,
                customer TEXT NOT NULL,
                job TEXT,
                date TEXT NOT NULL,
                due TEXT NOT NULL,
                subtotal REAL NOT NULL,
                discount REAL NOT NULL,
                tax REAL NOT NULL,
                total REAL NOT NULL,
                paid REAL NOT NULL,
                status TEXT NOT NULL,
                method TEXT
            )
        """)

        # 8. Notifications table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                desc TEXT NOT NULL,
                time TEXT NOT NULL,
                unread BOOLEAN NOT NULL DEFAULT 1,
                category TEXT NOT NULL DEFAULT 'general'
            )
        """)

        # 9. WhatsApp Logs table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS whatsapp_logs (
                id TEXT PRIMARY KEY,
                recipient TEXT NOT NULL,
                phone TEXT NOT NULL,
                clean_phone TEXT NOT NULL,
                event TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL,
                mode TEXT NOT NULL,
                wa_link TEXT,
                created_at TEXT NOT NULL,
                error TEXT
            )
        """)

        # 10. WhatsApp Templates table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS whatsapp_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        try:
            cur.execute("ALTER TABLE service_jobs ADD COLUMN phone TEXT")
        except Exception:
            pass

        conn.commit()

        # Seed data if tables are empty
        cur.execute("SELECT COUNT(*) FROM services")
        if cur.fetchone()[0] == 0:
            logger.info("[DB] Seeding initial data into SQLite database...")
            for s in SERVICES_CATALOG:
                cur.execute(
                    "INSERT INTO services (id, name, category, price, duration, desc, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
                    (s["id"], s["name"], s["category"], s["price"], s["duration"], s["desc"])
                )

            for a in APPOINTMENTS:
                cur.execute(
                    "INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (a["id"], a["customer"], a["vehicle"], a["plate"], a["service"],
                     a["date"], a["time"], a["status"], a["tech"], a["est"], a["cost"], a["notes"])
                )

            for j in SERVICE_JOBS:
                cur.execute(
                    "INSERT INTO service_jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (j["id"], j["appt"], j["vehicle"], j["plate"], j["customer"], j["service"],
                     j["tech"], j["status"], j["start"], j["mileage"], j["labor"], j["parts"], j["total"])
                )

            for e in EMPLOYEES:
                cur.execute(
                    "INSERT INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (e["id"], e["name"], e["role"], e["dept"], e["type"], e["salary"],
                     e["hire"], e["status"], e["phone"], e["email"])
                )

            for p in PAYROLL:
                cur.execute(
                    "INSERT INTO payroll VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (p["id"], p["employee"], p["name"], p["period"], p["basic"],
                     p["overtime"], p["otRate"], p["allowances"], p["deductions"], p["status"])
                )

            for pt in PARTS:
                cur.execute(
                    "INSERT INTO parts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (pt["id"], pt["partNo"], pt["name"], pt["category"], pt["stock"],
                     pt["reorder"], pt["unit"], pt["cost"], pt["price"], pt["supplier"])
                )

            for inv in INVOICES:
                cur.execute(
                    "INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (inv["id"], inv["invoiceNo"], inv["customer"], inv["job"], inv["date"],
                     inv["due"], inv["subtotal"], inv["discount"], inv["tax"], inv["total"],
                     inv["paid"], inv["status"], inv["method"])
                )

            for n in NOTIFICATIONS:
                cur.execute(
                    "INSERT INTO notifications (type, title, desc, time, unread, category) VALUES (?, ?, ?, ?, ?, ?)",
                    (n["type"], n["title"], n["desc"], n["time"], 1 if n["unread"] else 0, n["category"])
                )

            conn.commit()
            logger.info("[DB] Seed complete with 12 services, 8 appointments, 5 jobs, 10 employees, 10 parts, 4 invoices.")

        conn.close()

    def query_all(self, sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Query multiple rows returned as list of dicts."""
        if self.engine == "sqlite":
            conn = self._get_sqlite_connection()
            cur = conn.cursor()
            cur.execute(sql, params)
            rows = [dict(row) for row in cur.fetchall()]
            conn.close()
            return rows
        else:
            with self.pg_conn.cursor() as cur:
                cur.execute(sql, params)
                columns = [desc[0] for desc in cur.description]
                return [dict(zip(columns, row)) for row in cur.fetchall()]

    def query_one(self, sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        """Query single row returned as dict."""
        results = self.query_all(sql, params)
        return results[0] if results else None

    def execute_write(self, sql: str, params: tuple = ()) -> int:
        """Execute INSERT/UPDATE/DELETE and return modified row count or lastrowid."""
        if self.engine == "sqlite":
            conn = self._get_sqlite_connection()
            cur = conn.cursor()
            cur.execute(sql, params)
            conn.commit()
            last_id = cur.lastrowid
            conn.close()
            return last_id
        else:
            with self.pg_conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.rowcount

    def get_status(self) -> Dict[str, Any]:
        """Returns database health status and counts."""
        try:
            if self.engine == "sqlite":
                conn = self._get_sqlite_connection()
                cur = conn.cursor()
                counts = {}
                for tbl in ["services", "appointments", "service_jobs", "employees", "parts", "invoices"]:
                    cur.execute(f"SELECT COUNT(*) FROM {tbl}")
                    counts[tbl] = cur.fetchone()[0]
                conn.close()
                return {
                    "engine": "sqlite",
                    "status": "connected",
                    "database": str(settings.SQLITE_DB_PATH.name),
                    "hybrid_fallback_active": True,
                    "record_counts": counts
                }
            else:
                return {
                    "engine": "postgresql",
                    "status": "connected",
                    "database": settings.DATABASE_URL.split("/")[-1],
                    "hybrid_fallback_active": False
                }
        except Exception as e:
            return {"engine": self.engine, "status": "error", "error": str(e)}

# Singleton database manager instance
db = DatabaseManager()
