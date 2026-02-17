import {
  Facebook,
  Instagram,
  Key,
  Laptop,
  Mail,
  MessageCircle,
  MessageCircleMore,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { ComponentType } from 'react';

/**
 * Мапа іконок для типів контактів
 */
export const contactIconMap: Record<string, ComponentType<{ className?: string }>> = {
  phone: Phone,
  email: Mail,
  viber: MessageCircle,
  whatsapp: MessageSquare,
  telegram: Send,
  facebook: Facebook,
  messenger: MessageCircleMore,
  instagram: Instagram,
};

/**
 * Мапа іконок для типів Passkey
 *
 * Типи з Better Auth:
 * - multiDevice + backedUp: синхронізовані пристрої (iCloud Keychain, Google Password Manager)
 * - multiDevice: локальні пристрої (Touch ID, Face ID, Windows Hello)
 * - singleDevice: фізичні ключі безпеки (YubiKey, USB)
 * - unknown: невідомий тип
 */
export const passkeyIconMap = {
  multiDeviceSynced: Smartphone, // 📱 Синхронізований пристрій
  multiDeviceLocal: Laptop, // 💻 Локальний пристрій
  singleDevice: Key, // 🔑 Фізичний ключ безпеки
  unknown: ShieldCheck, // 🔐 Невідомий тип
};

/**
 * Отримує іконку для типу Passkey
 *
 * @param deviceType - Тип пристрою з Better Auth ('multiDevice' | 'singleDevice' | null)
 * @param backedUp - Чи синхронізовано credential в хмару
 * @returns React компонент іконки з Lucide React
 *
 * @example
 * const IconComponent = getPasskeyIcon('multiDevice', true);
 * <IconComponent className="size-4" />
 */
export function getPasskeyIcon(
  deviceType: string | null | undefined,
  backedUp?: boolean
): ComponentType<{ className?: string }> {
  // Better Auth: multiDevice = Touch ID, Face ID, Windows Hello
  if (deviceType === 'multiDevice') {
    return backedUp ? passkeyIconMap.multiDeviceSynced : passkeyIconMap.multiDeviceLocal;
  }

  // Better Auth: singleDevice = USB ключі безпеки, NFC
  if (deviceType === 'singleDevice') {
    return passkeyIconMap.singleDevice;
  }

  // Невідомий тип (null або інше значення)
  return passkeyIconMap.unknown;
}
