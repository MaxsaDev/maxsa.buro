import { toast } from 'sonner';

import { ActionStatus } from '@/interfaces/action-status';

/**
 * Показує уведомлення на основі ActionStatus
 * @param actionStatus - об'єкт з результатом виконання дії
 * @param options - додаткові опції для налаштування уведомлення
 */
export const showNotification = (
  actionStatus: ActionStatus,
  options?: {
    /** Перевизначити стандартне повідомлення */
    customMessage?: string;
    /** Додаткові опції для sonner */
    toastOptions?: {
      duration?: number;
      position?:
        | 'top-left'
        | 'top-center'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-center'
        | 'bottom-right';
      dismissible?: boolean;
      description?: string;
      action?: {
        label: string;
        onClick: () => void;
      };
    };
  }
) => {
  const message = options?.customMessage || actionStatus.message;
  const toastOptions = options?.toastOptions || {};

  switch (actionStatus.status) {
    case 'success':
      toast.success(message, {
        duration: 4000,
        ...toastOptions,
      });
      break;

    case 'error':
      toast.error(message, {
        duration: 6000,
        ...toastOptions,
      });
      break;

    case 'warning':
      toast.warning(message, {
        duration: 5000,
        ...toastOptions,
      });
      break;

    case 'info':
      toast.info(message, {
        duration: 4000,
        ...toastOptions,
      });
      break;

    // case 'two_factor':
    //   toast.info(message, {
    //     duration: 5000,
    //     ...toastOptions,
    //   });
    //   break;

    default:
      // Fallback для невідомих статусів
      toast(message, {
        duration: 4000,
        ...toastOptions,
      });
      break;
  }
};

/**
 * Спрощена функція для швидкого показу повідомлень успіху
 */
export const showSuccess = (message: string, options?: Parameters<typeof showNotification>[1]) => {
  showNotification({ status: 'success' as const, message }, options);
};

/**
 * Спрощена функція для швидкого показу повідомлень про помилки
 */
export const showError = (message: string, options?: Parameters<typeof showNotification>[1]) => {
  showNotification({ status: 'error' as const, message }, options);
};

/**
 * Спрощена функція для швидкого показу інформаційних повідомлень
 */
export const showInfo = (message: string, options?: Parameters<typeof showNotification>[1]) => {
  showNotification({ status: 'info' as const, message }, options);
};

/**
 * Спрощена функція для швидкого показу попереджень
 */
export const showWarning = (message: string, options?: Parameters<typeof showNotification>[1]) => {
  showNotification({ status: 'warning' as const, message }, options);
};
