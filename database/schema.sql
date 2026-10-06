-- ============================================================
--  AUTO LAB 360 — Complete PostgreSQL Database Schema
--  Version : 1.0.0
--  Created : 2026-09-26
-- ============================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
--  SCHEMA NAMESPACES
-- ============================================================
CREATE SCHEMA IF NOT EXISTS core;      -- Shared / reference data
CREATE SCHEMA IF NOT EXISTS hr;        -- Human Resources & Payroll
CREATE SCHEMA IF NOT EXISTS ops;       -- Operations (appointments, jobs, inventory)
CREATE SCHEMA IF NOT EXISTS billing;   -- Invoices, payments, discounts
CREATE SCHEMA IF NOT EXISTS reports;   -- Views & materialised views for reporting

-- ============================================================
--  ENUMS
-- ============================================================

-- User roles
CREATE TYPE core.user_role AS ENUM (
    'admin',
    'manager',
    'service_advisor',
    'receptionist',
    'customer'
);

-- Appointment / job status
CREATE TYPE ops.appointment_status AS ENUM (
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE ops.job_status AS ENUM (
    'queued',
    'assigned',
    'in_progress',
    'on_hold',
    'completed',
    'cancelled'
);

-- Vehicle fuel type
CREATE TYPE core.fuel_type AS ENUM (
    'petrol',
    'diesel',
    'hybrid',
    'electric',
    'lpg',
    'other'
);

-- Vehicle transmission
CREATE TYPE core.transmission AS ENUM (
    'automatic',
    'manual',
    'cvt',
    'semi_automatic'
);

-- HR enums
CREATE TYPE hr.employment_type AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'intern'
);

CREATE TYPE hr.leave_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);

CREATE TYPE hr.leave_type AS ENUM (
    'annual',
    'sick',
    'unpaid',
    'maternity',
    'paternity',
    'emergency'
);

CREATE TYPE hr.attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'half_day',
    'on_leave'
);

CREATE TYPE hr.payroll_status AS ENUM (
    'draft',
    'approved',
    'paid',
    'cancelled'
);

-- Billing enums
CREATE TYPE billing.invoice_status AS ENUM (
    'draft',
    'issued',
    'partially_paid',
    'paid',
    'overdue',
    'cancelled',
    'refunded'
);

CREATE TYPE billing.payment_method AS ENUM (
    'cash',
    'card',
    'bank_transfer',
    'mobile_payment',
    'cheque'
);

CREATE TYPE billing.discount_type AS ENUM (
    'percentage',
    'fixed_amount'
);

-- Inventory
CREATE TYPE ops.stock_transaction_type AS ENUM (
    'purchase',
    'usage',
    'adjustment',
    'return',
    'write_off'
);


-- ============================================================
--  CORE SCHEMA — Shared / Reference Tables
-- ============================================================

-- ------------------------------------------------------------
--  1. USERS  (all system users incl. customers)
-- ------------------------------------------------------------
CREATE TABLE core.users (
    user_id         UUID            DEFAULT uuid_generate_v4() PRIMARY KEY,
    role            core.user_role  NOT NULL,
    first_name      VARCHAR(80)     NOT NULL,
    last_name       VARCHAR(80)     NOT NULL,
    email           VARCHAR(254)    UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password_hash   TEXT            NOT NULL,   -- bcrypt / argon2 hash
    profile_photo   TEXT,                       -- file path or URL
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
--  2. CUSTOMERS  (extends users where role = 'customer')
-- ------------------------------------------------------------
CREATE TABLE core.customers (
    customer_id     UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id         UUID        NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
    address         TEXT,
    city            VARCHAR(100),
    notes           TEXT,                       -- VIP flag, preferences, etc.
    loyalty_points  INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- ------------------------------------------------------------
--  3. VEHICLES  (a customer may have many vehicles)
-- ------------------------------------------------------------
CREATE TABLE core.vehicles (
    vehicle_id          UUID                DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id         UUID                NOT NULL REFERENCES core.customers(customer_id) ON DELETE RESTRICT,
    plate_number        VARCHAR(20)         NOT NULL,
    vin                 VARCHAR(17),        -- Vehicle Identification Number
    make                VARCHAR(80)         NOT NULL,   -- e.g. Toyota
    model               VARCHAR(80)         NOT NULL,   -- e.g. Corolla
    year                SMALLINT            NOT NULL CHECK (year BETWEEN 1900 AND 2100),
    color               VARCHAR(50),
    fuel_type           core.fuel_type      NOT NULL DEFAULT 'petrol',
    transmission        core.transmission,
    engine_capacity_cc  INTEGER,            -- engine size in cc
    current_mileage_km  INTEGER,
    notes               TEXT,
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    UNIQUE (plate_number)
);

-- ------------------------------------------------------------
--  4. SERVICES CATALOG
-- ------------------------------------------------------------
CREATE TABLE core.service_categories (
    category_id     SERIAL      PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,  -- e.g. "Brake & Suspension Repair"
    description     TEXT,
    display_order   SMALLINT    NOT NULL DEFAULT 0,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE core.services (
    service_id          SERIAL          PRIMARY KEY,
    category_id         INTEGER         NOT NULL REFERENCES core.service_categories(category_id),
    name                VARCHAR(150)    NOT NULL,
    description         TEXT,
    base_price          NUMERIC(10,2)   NOT NULL CHECK (base_price >= 0),
    estimated_duration_min INTEGER      NOT NULL DEFAULT 60, -- in minutes
    requires_parts      BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- ============================================================
--  HR SCHEMA — Employees, Payroll, Attendance, Leave
-- ============================================================

-- ------------------------------------------------------------
--  5. DEPARTMENTS
-- ------------------------------------------------------------
CREATE TABLE hr.departments (
    department_id   SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    description     TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------
--  6. JOB TITLES / DESIGNATIONS
-- ------------------------------------------------------------
CREATE TABLE hr.job_titles (
    job_title_id    SERIAL          PRIMARY KEY,
    title           VARCHAR(100)    NOT NULL UNIQUE,
    department_id   INTEGER         REFERENCES hr.departments(department_id),
    description     TEXT
);

-- ------------------------------------------------------------
--  7. EMPLOYEES  (all non-customer staff)
-- ------------------------------------------------------------
CREATE TABLE hr.employees (
    employee_id         UUID                DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id             UUID                NOT NULL REFERENCES core.users(user_id) ON DELETE RESTRICT,
    employee_code       VARCHAR(20)         NOT NULL UNIQUE,  -- e.g. EMP-001
    department_id       INTEGER             REFERENCES hr.departments(department_id),
    job_title_id        INTEGER             REFERENCES hr.job_titles(job_title_id),
    employment_type     hr.employment_type  NOT NULL DEFAULT 'full_time',
    date_of_birth       DATE,
    national_id         VARCHAR(50)         UNIQUE,
    hire_date           DATE                NOT NULL,
    end_date            DATE,               -- NULL = currently employed
    basic_salary        NUMERIC(12,2)       NOT NULL CHECK (basic_salary >= 0),
    bank_account_no     VARCHAR(50),
    bank_name           VARCHAR(100),
    emergency_contact_name  VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    address             TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- ------------------------------------------------------------
--  8. TECHNICIANS  (employees who perform service jobs)
-- ------------------------------------------------------------
CREATE TABLE hr.technicians (
    technician_id   UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id     UUID        NOT NULL REFERENCES hr.employees(employee_id) ON DELETE CASCADE,
    specializations TEXT[],     -- array of service category names
    skill_level     VARCHAR(20) CHECK (skill_level IN ('junior','mid','senior','lead')),
    is_available    BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (employee_id)
);

-- ------------------------------------------------------------
--  9. SALARY COMPONENTS  (allowances / deductions types)
-- ------------------------------------------------------------
CREATE TABLE hr.salary_components (
    component_id    SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,  -- e.g. "Housing Allowance", "Tax"
    component_type  VARCHAR(10)     NOT NULL CHECK (component_type IN ('allowance','deduction')),
    is_taxable      BOOLEAN         NOT NULL DEFAULT TRUE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------
--  10. PAYROLL PERIODS
-- ------------------------------------------------------------
CREATE TABLE hr.payroll_periods (
    period_id       SERIAL          PRIMARY KEY,
    period_name     VARCHAR(50)     NOT NULL,   -- e.g. "September 2026"
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    is_closed       BOOLEAN         NOT NULL DEFAULT FALSE,
    UNIQUE (start_date, end_date)
);

-- ------------------------------------------------------------
--  11. PAYROLL RUNS  (one run per employee per period)
-- ------------------------------------------------------------
CREATE TABLE hr.payroll_runs (
    payroll_id          UUID            DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id         UUID            NOT NULL REFERENCES hr.employees(employee_id),
    period_id           INTEGER         NOT NULL REFERENCES hr.payroll_periods(period_id),
    basic_salary        NUMERIC(12,2)   NOT NULL,
    overtime_hours      NUMERIC(5,2)    NOT NULL DEFAULT 0,
    overtime_rate       NUMERIC(10,2)   NOT NULL DEFAULT 0,   -- per hour
    overtime_amount     NUMERIC(12,2)   GENERATED ALWAYS AS (overtime_hours * overtime_rate) STORED,
    total_allowances    NUMERIC(12,2)   NOT NULL DEFAULT 0,
    total_deductions    NUMERIC(12,2)   NOT NULL DEFAULT 0,
    gross_salary        NUMERIC(12,2)   GENERATED ALWAYS AS (basic_salary + (overtime_hours * overtime_rate) + total_allowances) STORED,
    net_salary          NUMERIC(12,2)   GENERATED ALWAYS AS (basic_salary + (overtime_hours * overtime_rate) + total_allowances - total_deductions) STORED,
    status              hr.payroll_status NOT NULL DEFAULT 'draft',
    approved_by         UUID            REFERENCES core.users(user_id),
    approved_at         TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, period_id)
);

-- Line items for each payroll run (allowances & deductions)
CREATE TABLE hr.payroll_line_items (
    line_item_id    SERIAL          PRIMARY KEY,
    payroll_id      UUID            NOT NULL REFERENCES hr.payroll_runs(payroll_id) ON DELETE CASCADE,
    component_id    INTEGER         NOT NULL REFERENCES hr.salary_components(component_id),
    amount          NUMERIC(12,2)   NOT NULL,
    notes           TEXT
);

-- ------------------------------------------------------------
--  12. ATTENDANCE
-- ------------------------------------------------------------
CREATE TABLE hr.attendance (
    attendance_id   UUID                    DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id     UUID                    NOT NULL REFERENCES hr.employees(employee_id),
    attendance_date DATE                    NOT NULL,
    status          hr.attendance_status    NOT NULL DEFAULT 'present',
    check_in        TIMETZ,
    check_out       TIMETZ,
    overtime_hours  NUMERIC(4,2)            NOT NULL DEFAULT 0,
    notes           TEXT,
    recorded_by     UUID                    REFERENCES core.users(user_id),
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, attendance_date)
);

-- ------------------------------------------------------------
--  13. LEAVE REQUESTS
-- ------------------------------------------------------------
CREATE TABLE hr.leave_requests (
    leave_id        UUID                DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id     UUID                NOT NULL REFERENCES hr.employees(employee_id),
    leave_type      hr.leave_type       NOT NULL,
    start_date      DATE                NOT NULL,
    end_date        DATE                NOT NULL,
    total_days      SMALLINT            NOT NULL,
    reason          TEXT,
    status          hr.leave_status     NOT NULL DEFAULT 'pending',
    reviewed_by     UUID                REFERENCES core.users(user_id),
    reviewed_at     TIMESTAMPTZ,
    reviewer_notes  TEXT,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_leave_dates CHECK (end_date >= start_date)
);

-- Leave balances per employee per year
CREATE TABLE hr.leave_balances (
    balance_id      SERIAL      PRIMARY KEY,
    employee_id     UUID        NOT NULL REFERENCES hr.employees(employee_id),
    leave_type      hr.leave_type NOT NULL,
    year            SMALLINT    NOT NULL,
    total_days      SMALLINT    NOT NULL DEFAULT 0,
    used_days       SMALLINT    NOT NULL DEFAULT 0,
    remaining_days  SMALLINT    GENERATED ALWAYS AS (total_days - used_days) STORED,
    UNIQUE (employee_id, leave_type, year)
);


-- ============================================================
--  OPS SCHEMA — Appointments, Jobs, Inventory
-- ============================================================

-- ------------------------------------------------------------
--  14. APPOINTMENTS
-- ------------------------------------------------------------
CREATE TABLE ops.appointments (
    appointment_id          UUID                        DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id             UUID                        NOT NULL REFERENCES core.customers(customer_id),
    vehicle_id              UUID                        NOT NULL REFERENCES core.vehicles(vehicle_id),
    preferred_technician_id UUID                        REFERENCES hr.technicians(technician_id),
    appointment_date        DATE                        NOT NULL,
    appointment_time        TIMETZ                      NOT NULL,
    estimated_duration_min  INTEGER                     NOT NULL DEFAULT 60,
    status                  ops.appointment_status      NOT NULL DEFAULT 'pending',
    estimated_cost          NUMERIC(10,2),
    customer_notes          TEXT,
    internal_notes          TEXT,
    confirmed_by            UUID                        REFERENCES core.users(user_id),
    confirmed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

-- Many-to-many: appointment <-> services requested
CREATE TABLE ops.appointment_services (
    id              SERIAL      PRIMARY KEY,
    appointment_id  UUID        NOT NULL REFERENCES ops.appointments(appointment_id) ON DELETE CASCADE,
    service_id      INTEGER     NOT NULL REFERENCES core.services(service_id),
    UNIQUE (appointment_id, service_id)
);

-- ------------------------------------------------------------
--  15. SERVICE JOBS  (workshop job card — created from appointment)
-- ------------------------------------------------------------
CREATE TABLE ops.service_jobs (
    job_id                  UUID                DEFAULT uuid_generate_v4() PRIMARY KEY,
    appointment_id          UUID                REFERENCES ops.appointments(appointment_id),
    vehicle_id              UUID                NOT NULL REFERENCES core.vehicles(vehicle_id),
    customer_id             UUID                NOT NULL REFERENCES core.customers(customer_id),
    assigned_technician_id  UUID                REFERENCES hr.technicians(technician_id),
    job_number              VARCHAR(30)         NOT NULL UNIQUE,  -- e.g. JOB-2026-00001
    status                  ops.job_status      NOT NULL DEFAULT 'queued',
    mileage_at_service      INTEGER,
    problem_description     TEXT,
    diagnosis_notes         TEXT,
    work_performed          TEXT,
    start_time              TIMESTAMPTZ,
    end_time                TIMESTAMPTZ,
    created_by              UUID                REFERENCES core.users(user_id),
    created_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Services actually performed in a job
CREATE TABLE ops.job_services (
    job_service_id  SERIAL          PRIMARY KEY,
    job_id          UUID            NOT NULL REFERENCES ops.service_jobs(job_id) ON DELETE CASCADE,
    service_id      INTEGER         NOT NULL REFERENCES core.services(service_id),
    technician_id   UUID            REFERENCES hr.technicians(technician_id),
    labor_cost      NUMERIC(10,2)   NOT NULL DEFAULT 0,
    duration_min    INTEGER,
    notes           TEXT,
    UNIQUE (job_id, service_id)
);

-- ------------------------------------------------------------
--  16. INVENTORY / PARTS
-- ------------------------------------------------------------
CREATE TABLE ops.part_categories (
    category_id     SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    description     TEXT
);

CREATE TABLE ops.parts (
    part_id             SERIAL          PRIMARY KEY,
    category_id         INTEGER         REFERENCES ops.part_categories(category_id),
    part_number         VARCHAR(60)     NOT NULL UNIQUE,
    name                VARCHAR(150)    NOT NULL,
    description         TEXT,
    unit                VARCHAR(20)     NOT NULL DEFAULT 'pcs',
    cost_price          NUMERIC(10,2)   NOT NULL CHECK (cost_price >= 0),
    selling_price       NUMERIC(10,2)   NOT NULL CHECK (selling_price >= 0),
    quantity_in_stock   NUMERIC(10,2)   NOT NULL DEFAULT 0,
    reorder_level       NUMERIC(10,2)   NOT NULL DEFAULT 0,
    max_stock_level     NUMERIC(10,2),
    supplier            VARCHAR(150),
    location            VARCHAR(100),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Parts used in a specific job
CREATE TABLE ops.job_parts (
    job_part_id     SERIAL          PRIMARY KEY,
    job_id          UUID            NOT NULL REFERENCES ops.service_jobs(job_id) ON DELETE CASCADE,
    part_id         INTEGER         NOT NULL REFERENCES ops.parts(part_id),
    quantity        NUMERIC(10,2)   NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(10,2)   NOT NULL,  -- snapshot of selling price at time of use
    total_price     NUMERIC(12,2)   GENERATED ALWAYS AS (quantity * unit_price) STORED,
    UNIQUE (job_id, part_id)
);

-- Full stock transaction ledger
CREATE TABLE ops.stock_transactions (
    transaction_id      SERIAL                          PRIMARY KEY,
    part_id             INTEGER                         NOT NULL REFERENCES ops.parts(part_id),
    transaction_type    ops.stock_transaction_type      NOT NULL,
    quantity            NUMERIC(10,2)                   NOT NULL,  -- positive=in, negative=out
    reference_job_id    UUID                            REFERENCES ops.service_jobs(job_id),
    unit_cost           NUMERIC(10,2),
    notes               TEXT,
    created_by          UUID                            REFERENCES core.users(user_id),
    created_at          TIMESTAMPTZ                     NOT NULL DEFAULT NOW()
);


-- ============================================================
--  BILLING SCHEMA — Invoices, Payments, Discounts
-- ============================================================

-- ------------------------------------------------------------
--  17. DISCOUNT / PROMOTIONS
-- ------------------------------------------------------------
CREATE TABLE billing.discounts (
    discount_id     SERIAL                  PRIMARY KEY,
    code            VARCHAR(50)             UNIQUE,     -- NULL = auto-apply (no code needed)
    name            VARCHAR(100)            NOT NULL,
    description     TEXT,
    discount_type   billing.discount_type   NOT NULL,
    value           NUMERIC(10,2)           NOT NULL CHECK (value > 0),
    max_uses        INTEGER,                            -- NULL = unlimited
    uses_count      INTEGER                 NOT NULL DEFAULT 0,
    min_order_value NUMERIC(10,2)           NOT NULL DEFAULT 0,
    valid_from      DATE,
    valid_until     DATE,
    is_active       BOOLEAN                 NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
--  18. INVOICES
-- ------------------------------------------------------------
CREATE TABLE billing.invoices (
    invoice_id          UUID                        DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number      VARCHAR(30)                 NOT NULL UNIQUE,   -- INV-2026-00001
    job_id              UUID                        NOT NULL REFERENCES ops.service_jobs(job_id),
    customer_id         UUID                        NOT NULL REFERENCES core.customers(customer_id),
    discount_id         INTEGER                     REFERENCES billing.discounts(discount_id),
    invoice_date        DATE                        NOT NULL DEFAULT CURRENT_DATE,
    due_date            DATE                        NOT NULL,
    subtotal            NUMERIC(12,2)               NOT NULL DEFAULT 0,  -- labor + parts
    discount_amount     NUMERIC(12,2)               NOT NULL DEFAULT 0,
    tax_rate            NUMERIC(5,2)                NOT NULL DEFAULT 0,  -- e.g. 5.00 = 5%
    tax_amount          NUMERIC(12,2)               GENERATED ALWAYS AS
                            (ROUND((subtotal - discount_amount) * tax_rate / 100, 2)) STORED,
    total_amount        NUMERIC(12,2)               GENERATED ALWAYS AS
                            (subtotal - discount_amount + ROUND((subtotal - discount_amount) * tax_rate / 100, 2)) STORED,
    amount_paid         NUMERIC(12,2)               NOT NULL DEFAULT 0,
    status              billing.invoice_status      NOT NULL DEFAULT 'draft',
    notes               TEXT,
    created_by          UUID                        REFERENCES core.users(user_id),
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
--  19. PAYMENTS
-- ------------------------------------------------------------
CREATE TABLE billing.payments (
    payment_id          UUID                        DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id          UUID                        NOT NULL REFERENCES billing.invoices(invoice_id),
    payment_date        DATE                        NOT NULL DEFAULT CURRENT_DATE,
    amount              NUMERIC(12,2)               NOT NULL CHECK (amount > 0),
    payment_method      billing.payment_method      NOT NULL,
    reference_number    VARCHAR(100),               -- cheque no, txn ref, etc.
    received_by         UUID                        REFERENCES core.users(user_id),
    notes               TEXT,
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);


-- ============================================================
--  REPORTING VIEWS  (schema: reports)
-- ============================================================

-- Daily appointment summary
CREATE OR REPLACE VIEW reports.daily_appointments AS
SELECT
    a.appointment_date,
    COUNT(*)                                        AS total_appointments,
    COUNT(*) FILTER (WHERE a.status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE a.status = 'cancelled') AS cancelled,
    COUNT(*) FILTER (WHERE a.status = 'no_show')   AS no_shows
FROM ops.appointments a
GROUP BY a.appointment_date;

-- Revenue per service category
CREATE OR REPLACE VIEW reports.revenue_by_service_category AS
SELECT
    sc.name                                                     AS category,
    COUNT(js.job_service_id)                                    AS jobs_count,
    SUM(js.labor_cost)                                          AS total_labor_revenue,
    COALESCE(SUM(jp.total_price), 0)                            AS total_parts_revenue,
    SUM(js.labor_cost) + COALESCE(SUM(jp.total_price), 0)      AS total_revenue
FROM ops.job_services js
JOIN core.services s             ON s.service_id    = js.service_id
JOIN core.service_categories sc  ON sc.category_id  = s.category_id
LEFT JOIN ops.job_parts jp       ON jp.job_id       = js.job_id
GROUP BY sc.name;

-- Monthly payroll summary
CREATE OR REPLACE VIEW reports.monthly_payroll_summary AS
SELECT
    pp.period_name,
    COUNT(pr.payroll_id)        AS employees_paid,
    SUM(pr.basic_salary)        AS total_basic,
    SUM(pr.overtime_amount)     AS total_overtime,
    SUM(pr.total_allowances)    AS total_allowances,
    SUM(pr.total_deductions)    AS total_deductions,
    SUM(pr.gross_salary)        AS total_gross,
    SUM(pr.net_salary)          AS total_net
FROM hr.payroll_runs pr
JOIN hr.payroll_periods pp ON pp.period_id = pr.period_id
WHERE pr.status = 'paid'
GROUP BY pp.period_id, pp.period_name
ORDER BY pp.start_date;

-- Low stock alert view
CREATE OR REPLACE VIEW reports.low_stock_parts AS
SELECT
    p.part_id,
    p.part_number,
    p.name,
    p.quantity_in_stock,
    p.reorder_level,
    p.supplier
FROM ops.parts p
WHERE p.quantity_in_stock <= p.reorder_level
  AND p.is_active = TRUE
ORDER BY (p.quantity_in_stock - p.reorder_level);

-- Customer vehicle history
CREATE OR REPLACE VIEW reports.customer_vehicle_history AS
SELECT
    cu.first_name || ' ' || cu.last_name                        AS customer_name,
    v.plate_number,
    v.make || ' ' || v.model || ' (' || v.year || ')'           AS vehicle,
    sj.job_number,
    sj.created_at                                               AS job_date,
    sj.status                                                   AS job_status,
    i.invoice_number,
    i.total_amount,
    i.status                                                    AS invoice_status
FROM ops.service_jobs sj
JOIN core.vehicles v         ON v.vehicle_id    = sj.vehicle_id
JOIN core.customers c        ON c.customer_id   = sj.customer_id
JOIN core.users cu           ON cu.user_id      = c.user_id
LEFT JOIN billing.invoices i ON i.job_id        = sj.job_id
ORDER BY sj.created_at DESC;


-- ============================================================
--  SEQUENCES  (formatted reference numbers)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS ops.job_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS billing.invoice_number_seq START 1;

-- Helper functions to generate formatted numbers
CREATE OR REPLACE FUNCTION ops.next_job_number()
RETURNS TEXT LANGUAGE sql AS $$
    SELECT 'JOB-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
           LPAD(nextval('ops.job_number_seq')::TEXT, 5, '0');
$$;

CREATE OR REPLACE FUNCTION billing.next_invoice_number()
RETURNS TEXT LANGUAGE sql AS $$
    SELECT 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
           LPAD(nextval('billing.invoice_number_seq')::TEXT, 5, '0');
$$;


-- ============================================================
--  TRIGGERS — Auto-update updated_at on all tables
-- ============================================================
CREATE OR REPLACE FUNCTION core.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply trigger to every table in managed schemas that has updated_at
DO $$ DECLARE t RECORD; BEGIN
    FOR t IN
        SELECT schemaname, tablename FROM pg_tables
        WHERE schemaname IN ('core','hr','ops','billing')
    LOOP
        EXECUTE format(
            'CREATE OR REPLACE TRIGGER trg_%s_%s_updated_at
             BEFORE UPDATE ON %I.%I
             FOR EACH ROW EXECUTE FUNCTION core.set_updated_at()',
            t.schemaname, t.tablename, t.schemaname, t.tablename
        );
    END LOOP;
END $$;


-- ============================================================
--  TRIGGER — Deduct stock when parts are added to a job
-- ============================================================
CREATE OR REPLACE FUNCTION ops.deduct_stock_on_job_part_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE ops.parts
    SET quantity_in_stock = quantity_in_stock - NEW.quantity,
        updated_at        = NOW()
    WHERE part_id = NEW.part_id;

    INSERT INTO ops.stock_transactions
        (part_id, transaction_type, quantity, reference_job_id)
    VALUES
        (NEW.part_id, 'usage', -NEW.quantity, NEW.job_id);

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_job_parts_deduct_stock
AFTER INSERT ON ops.job_parts
FOR EACH ROW EXECUTE FUNCTION ops.deduct_stock_on_job_part_insert();


-- ============================================================
--  TRIGGER — Update invoice amount_paid when a payment is added
-- ============================================================
CREATE OR REPLACE FUNCTION billing.update_invoice_amount_paid()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_paid   NUMERIC(12,2);
    v_total  NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM(amount), 0)
    INTO v_paid
    FROM billing.payments
    WHERE invoice_id = NEW.invoice_id;

    SELECT total_amount INTO v_total
    FROM billing.invoices
    WHERE invoice_id = NEW.invoice_id;

    UPDATE billing.invoices
    SET amount_paid = v_paid,
        status = CASE
            WHEN v_paid >= v_total THEN 'paid'::billing.invoice_status
            WHEN v_paid > 0        THEN 'partially_paid'::billing.invoice_status
            ELSE status
        END,
        updated_at = NOW()
    WHERE invoice_id = NEW.invoice_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payments_update_invoice
AFTER INSERT ON billing.payments
FOR EACH ROW EXECUTE FUNCTION billing.update_invoice_amount_paid();


-- ============================================================
--  INDEXES — Performance
-- ============================================================

-- Core
CREATE INDEX idx_users_email          ON core.users(email);
CREATE INDEX idx_vehicles_customer    ON core.vehicles(customer_id);
CREATE INDEX idx_vehicles_plate       ON core.vehicles(plate_number);

-- Appointments
CREATE INDEX idx_appt_date            ON ops.appointments(appointment_date);
CREATE INDEX idx_appt_customer        ON ops.appointments(customer_id);
CREATE INDEX idx_appt_status          ON ops.appointments(status);

-- Jobs
CREATE INDEX idx_jobs_vehicle         ON ops.service_jobs(vehicle_id);
CREATE INDEX idx_jobs_customer        ON ops.service_jobs(customer_id);
CREATE INDEX idx_jobs_status          ON ops.service_jobs(status);
CREATE INDEX idx_jobs_technician      ON ops.service_jobs(assigned_technician_id);

-- Inventory
CREATE INDEX idx_parts_stock_level    ON ops.parts(quantity_in_stock);
CREATE INDEX idx_stock_txn_part       ON ops.stock_transactions(part_id);

-- Billing
CREATE INDEX idx_invoices_customer    ON billing.invoices(customer_id);
CREATE INDEX idx_invoices_status      ON billing.invoices(status);
CREATE INDEX idx_payments_invoice     ON billing.payments(invoice_id);

-- HR
CREATE INDEX idx_attendance_emp_date  ON hr.attendance(employee_id, attendance_date);
CREATE INDEX idx_payroll_emp_period   ON hr.payroll_runs(employee_id, period_id);
CREATE INDEX idx_leave_emp            ON hr.leave_requests(employee_id);


-- ============================================================
--  SEED DATA — Service Categories & Services
-- ============================================================

INSERT INTO core.service_categories (name, description, display_order) VALUES
    ('Full Service & Lube',           'Complete vehicle service including oil change and lubrication', 1),
    ('Computer Diagnostics & Scanning','Electronic fault diagnosis using OBD scanners',              2),
    ('Brake & Suspension Repair',     'Brake pads, discs, calipers, shocks and struts',             3),
    ('AC Service & Repair',           'Air conditioning regas, repair and maintenance',              4),
    ('Wheel Alignment & Balancing',   'Four-wheel alignment and tyre balancing',                    5),
    ('Car Wash & Detailing',          'Exterior wash, interior cleaning, full detail packages',     6);

INSERT INTO core.services (category_id, name, base_price, estimated_duration_min, requires_parts) VALUES
    -- Full Service & Lube
    (1, 'Standard Oil Change',                  25.00,  30, TRUE),
    (1, 'Full Service (Oil, Filter, Fluids)',    85.00, 120, TRUE),
    (1, 'Lube Service',                         20.00,  30, TRUE),
    -- Computer Diagnostics
    (2, 'OBD Diagnostic Scan',                  40.00,  45, FALSE),
    (2, 'Full System Electronic Scan',          70.00,  90, FALSE),
    -- Brake & Suspension
    (3, 'Brake Pad Replacement (Front)',        60.00,  60, TRUE),
    (3, 'Brake Pad Replacement (Rear)',         60.00,  60, TRUE),
    (3, 'Brake Disc Replacement',             120.00,  90, TRUE),
    (3, 'Shock Absorber Replacement',         150.00, 120, TRUE),
    (3, 'Suspension Inspection',               35.00,  45, FALSE),
    -- AC
    (4, 'AC Regas (Refrigerant Top-up)',        55.00,  45, TRUE),
    (4, 'AC Full Service',                    120.00, 120, TRUE),
    (4, 'AC Compressor Replacement',          350.00, 180, TRUE),
    -- Alignment & Balancing
    (5, 'Four-Wheel Alignment',                45.00,  45, FALSE),
    (5, 'Tyre Balancing (per tyre)',           10.00,  15, FALSE),
    (5, 'Alignment + Balancing Package',       75.00,  60, FALSE),
    -- Car Wash & Detailing
    (6, 'Basic Exterior Wash',                 10.00,  20, FALSE),
    (6, 'Interior + Exterior Wash',            25.00,  45, FALSE),
    (6, 'Full Detail Package',                 80.00, 180, TRUE),
    (6, 'Engine Bay Cleaning',                 35.00,  45, FALSE);


-- ============================================================
--  SEED DATA — HR Departments & Job Titles
-- ============================================================

INSERT INTO hr.departments (name, description) VALUES
    ('Workshop',    'Vehicle service and repair operations'),
    ('Front Desk',  'Customer reception and appointment management'),
    ('Management',  'Business management and administration'),
    ('Accounts',    'Finance and billing'),
    ('Stores',      'Parts and inventory management');

INSERT INTO hr.job_titles (title, department_id) VALUES
    ('Workshop Manager',    3),
    ('Senior Technician',   1),
    ('Technician',          1),
    ('Junior Technician',   1),
    ('Service Advisor',     2),
    ('Receptionist',        2),
    ('HR Manager',          3),
    ('General Manager',     3),
    ('Accountant',          4),
    ('Store Keeper',        5);


-- ============================================================
--  SEED DATA — Salary Components
-- ============================================================

INSERT INTO hr.salary_components (name, component_type, is_taxable) VALUES
    ('Housing Allowance',       'allowance', FALSE),
    ('Transport Allowance',     'allowance', FALSE),
    ('Performance Bonus',       'allowance', TRUE),
    ('Overtime Bonus',          'allowance', TRUE),
    ('Income Tax',              'deduction', FALSE),
    ('Social Security',         'deduction', FALSE),
    ('Health Insurance',        'deduction', FALSE),
    ('Loan Repayment',          'deduction', FALSE),
    ('Absence Deduction',       'deduction', FALSE),
    ('Late Arrival Deduction',  'deduction', FALSE);


-- ============================================================
--  END OF SCHEMA — AUTO LAB 360
-- ============================================================
