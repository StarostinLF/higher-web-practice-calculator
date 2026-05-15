import type { ZodType } from 'zod';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export function validate<T>(schema: ZodType<T>, value: unknown): ValidationResult<T> {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}

export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}
