import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

/**
 * Сторінка онбордингу для нових користувачів
 * Відображається автоматично, якщо персональні дані не заповнені
 */
export default function OnboardingPage() {
  return <OnboardingWizard />;
}
