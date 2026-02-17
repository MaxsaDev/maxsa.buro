import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Електронна пошта обов'язкова" })
    .email({ message: 'Невірний формат електронної пошти' }),
  password: z.string().min(1, { message: "Пароль обов'язковий" }),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: "Електронна пошта обов'язкова" })
      .email({ message: 'Невірний формат електронної пошти' }),
    password: z.string().min(8, { message: 'Пароль має містити щонайменше 8 символів' }),
    confirmPassword: z.string().min(1, { message: "Підтвердження паролю обов'язкове" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const newPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: "Пароль обов'язковий" })
      .min(8, { message: 'Пароль має містити щонайменше 8 символів' }),
    confirmPassword: z.string().min(1, { message: "Підтвердження паролю обов'язкове" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });

export const twoFactorSchema = z.object({
  code: z
    .string()
    .min(6, 'Код має містити 6 цифр')
    .max(6, 'Код має містити 6 цифр')
    .regex(/^\d{6}$/, 'Код має містити лише цифри'),
});

export type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;
