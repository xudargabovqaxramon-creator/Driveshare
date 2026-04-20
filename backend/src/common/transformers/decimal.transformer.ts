import { ValueTransformer } from 'typeorm';

/**
 * Fix 9: PostgreSQL returns DECIMAL/NUMERIC columns as strings via the
 * node-postgres driver.  This transformer ensures callers always receive JS
 * numbers so arithmetic never silently operates on strings.
 *
 * Usage:
 *   @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
 *   pricePerDay: number;
 */
export const decimalTransformer: ValueTransformer = {
  /** JS → DB: pass through as-is; TypeORM handles the NUMERIC cast */
  to: (value: number | null): number | null => value,

  /** DB → JS: always coerce to float, preserve null */
  from: (value: string | number | null): number | null => {
    if (value === null || value === undefined) return null;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? null : parsed;
  },
};
