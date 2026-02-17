import { AuthFormPreviewCard } from '@/components/mx-admin/auth-pages-preview/auth-form-preview-card';
import { ForgotPasswordFormPreview } from '@/components/mx-admin/auth-pages-preview/forgot-password-form-preview';
import { LoginFormPreview } from '@/components/mx-admin/auth-pages-preview/login-form-preview';
import { ResetPasswordFormPreview } from '@/components/mx-admin/auth-pages-preview/reset-password-form-preview';
import { SignupFormPreview } from '@/components/mx-admin/auth-pages-preview/signup-form-preview';
import { VerifyEmailPreview } from '@/components/mx-admin/auth-pages-preview/verify-email-preview';

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Форми авторизації</h1>
        <p className="text-muted-foreground mt-2">
          Перегляд та тестування форм аутентифікації Better Auth
        </p>
      </div>

      {/* Сітка з превью форм */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AuthFormPreviewCard title="Вхід" href="/mx-admin/auth-pages/login">
          <LoginFormPreview />
        </AuthFormPreviewCard>

        <AuthFormPreviewCard title="Реєстрація" href="/mx-admin/auth-pages/register">
          <SignupFormPreview />
        </AuthFormPreviewCard>

        <AuthFormPreviewCard title="Забули пароль" href="/mx-admin/auth-pages/forgot-password">
          <ForgotPasswordFormPreview />
        </AuthFormPreviewCard>

        <AuthFormPreviewCard title="Скидання паролю" href="/mx-admin/auth-pages/reset-password">
          <ResetPasswordFormPreview />
        </AuthFormPreviewCard>

        <AuthFormPreviewCard title="Верифікація email" href="/mx-admin/auth-pages/verify-email">
          <VerifyEmailPreview />
        </AuthFormPreviewCard>
      </div>
    </div>
  );
}
