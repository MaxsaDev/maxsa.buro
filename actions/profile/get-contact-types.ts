'use server';

import { getActiveContactTypes } from '@/data/mx-dic/contact-types';
import type { DicContactType } from '@/interfaces/mx-dic/dic-contact-type';

/**
 * Server Action для отримання активних типів контактів
 *
 * Обгортка над data функцією для використання в Client Components
 *
 * @returns Promise<DicContactType[]>
 */
export async function getContactTypesAction(): Promise<DicContactType[]> {
  try {
    return await getActiveContactTypes();
  } catch (error) {
    console.error('[getContactTypesAction] Помилка:', error);
    return [];
  }
}
