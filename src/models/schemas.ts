import { z } from 'zod';

export const BudgetSchema = z.object({
  id: z.literal('current'),
  startBalance: z.number().positive('Баланс должен быть больше 0'),
  startDate: z.string().min(1, 'Укажите дату начала'),
  endDate: z.string().min(1, 'Укажите дату окончания'),
});

export const BudgetInputSchema = z
  .object({
    startBalance: z.number().positive('Баланс должен быть больше 0'),
    startDate: z.string().min(1, 'Укажите дату начала'),
    endDate: z.string().min(1, 'Укажите дату окончания'),
  })
  .refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'Дата окончания должна быть позже даты начала',
    path: ['endDate'],
  });

export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number().positive('Сумма должна быть больше 0'),
  date: z.string(),
  type: z.enum(['expense', 'topup']),
});

export const TransactionInputSchema = z.object({
  amount: z.number().positive('Сумма должна быть больше 0'),
  type: z.enum(['expense', 'topup']),
});

export type Budget = z.infer<typeof BudgetSchema>;
export type BudgetInput = z.infer<typeof BudgetInputSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionInput = z.infer<typeof TransactionInputSchema>;
