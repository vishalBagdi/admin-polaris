BEGIN;

-- 1) Add single punch-time based columns.
ALTER TABLE attendances
  ADD COLUMN IF NOT EXISTS punch_time TIME,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'present';

-- 2) Backfill punch_time from old check-in/check-out columns.
UPDATE attendances
SET
  punch_time = COALESCE(punch_time, check_in_time, check_out_time)
WHERE punch_time IS NULL;

-- 3) Enforce required values for row-wise data.
UPDATE attendances
SET
  punch_time = COALESCE(punch_time, '00:00:00'::time)
WHERE punch_time IS NULL;

ALTER TABLE attendances
  ALTER COLUMN punch_time SET NOT NULL;

-- 4) Remove old uniqueness and old time columns.
ALTER TABLE attendances DROP CONSTRAINT IF EXISTS attendances_code_attendance_date_key;
ALTER TABLE attendances DROP CONSTRAINT IF EXISTS attendances_punch_type_check;
ALTER TABLE attendances DROP CONSTRAINT IF EXISTS attendances_code_fkey;

ALTER TABLE attendances
  DROP COLUMN IF EXISTS punch_type,
  DROP COLUMN IF EXISTS check_in_time,
  DROP COLUMN IF EXISTS check_out_time;

-- 5) Add index and uniqueness for exact same punch event.
CREATE INDEX IF NOT EXISTS idx_attendances_code_date_time ON attendances(code, attendance_date, punch_time);
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendances_code_date_punchtime ON attendances(code, attendance_date, punch_time);

COMMIT;
