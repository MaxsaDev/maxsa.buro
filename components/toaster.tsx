'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Обгортка для Toaster з sonner
 * Використовується в Server Components (наприклад, RootLayout)
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        className: 'font-sans',
      }}
    />
  );
}
