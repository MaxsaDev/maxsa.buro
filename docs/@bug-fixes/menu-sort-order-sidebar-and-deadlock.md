# Bug Fix: Сортування меню в сайдбарі та Deadlock при перетаскуванні

**Дата**: 27 лютого 2026
**Гілка**: `dev-20260225-assignee-page`
**Версія**: 0.0.28+

---

## Описані проблеми

Дві окремі, але пов'язані одним функціоналом проблеми у системі drag-and-drop сортування меню в конструкторі (`/mx-admin/menu-app`).

---

## Проблема 1: Сайдбар ігнорував кастомний порядок меню

### Симптом

Адміністратор перетягував меню в конструкторі й змінював їхній порядок. Зміни зберігались у БД. Але при перезавантаженні сторінки звичайним користувачем сайдбар продовжував відображати меню у порядку **за датою створення** (insertion order), а не за встановленим адміністратором `sort_order`.

### Технічний аналіз

#### Ланцюг передачі даних

```
mx_dic.menus.sort_order (БД)
    ↓
nav_user_sections_user_view / nav_user_items_user_view (SQL Views)
    поле: menu_sort_order = m.sort_order
    ↓
getNavUserSectionsUserViewByUserId() / getNavUserItemsUserViewByUserId() (TypeScript)
    ↓
buildUserMenu() → MenuSection[] (lib/menu/build-user-menu.ts)
    ↓
Zustand store (useUserMenuStore)
    ↓
app-sidebar.tsx → сортує sortedMenus за menuSortOrder
```

#### Де була помилка

SQL-вьюшки (`nav_user_sections_user_view`, `nav_user_items_user_view`) коректно містили поле `menu_sort_order` і правильно заповнювали його з `mx_dic.menus.sort_order`. Клієнтський код у `app-sidebar.tsx` також правильно сортував `sortedMenus` за `menuSortOrder`.

Помилка була в **TypeScript-запитах** до вьюшок — `ORDER BY` не включав `menu_sort_order`:

```typescript
// data/mx-system/nav-user-sections.ts — БУЛО (помилково)
ORDER BY category_id, item_sort_order, item_id;

// data/mx-system/nav-user-items.ts — БУЛО (помилково)
ORDER BY item_sort_order, item_id;
```

PostgreSQL повертав рядки у порядку `item_id` (фактично — порядку вставки). `buildUserMenu()` групував по `menuId` через `Map`, який зберігає порядок першого додавання ключа. Перший зустрінутий `menuId` і ставав першим у результаті. Сортування у `app-sidebar.tsx` по `menuSortOrder` **відбувалось**, але воно коригувало вже правильний порядок (оскільки дані приходили в порядку `item_id`, а не `menu_sort_order`).

Тобто: дані правильно несли `menu_sort_order`, але `Map` в `buildUserMenu()` упорядковував меню за першою зустріченою `item_id`, а не за `menu_sort_order`.

> **Примітка:** `data/mx-system/nav-user-general.ts` вже мав правильний `ORDER BY menu_sort_order, menu_id, item_sort_order, item_id` і не потребував виправлення.

### Виправлення

**`data/mx-system/nav-user-sections.ts`** — функція `getNavUserSectionsUserViewByUserId`:

```typescript
// СТАЛО
ORDER BY menu_sort_order, menu_id, category_id, item_sort_order, item_id;
```

**`data/mx-system/nav-user-items.ts`** — функція `getNavUserItemsUserViewByUserId`:

```typescript
// СТАЛО
ORDER BY menu_sort_order, menu_id, item_sort_order, item_id;
```

Тепер дані приходять відсортованими по `menu_sort_order` спочатку. `Map` у `buildUserMenu()` зберігає порядок вставки, тому перший зустрінутий `menuId` відповідає меню з найменшим `sort_order`. Подальше сортування у `app-sidebar.tsx` є страховкою.

---

## Проблема 2: Deadlock при drag-and-drop сортуванні меню

### Симптом

При перетаскуванні меню в конструкторі у терміналі з'являлась помилка:

```
[updateMenuSortOrder] Помилка оновлення порядку меню: error: deadlock detected
  code: '40P01',
  detail: 'Process 891 waits for ShareLock on transaction 56321; blocked by process 892.
           Process 892 waits for ShareLock on transaction 56320; blocked by process 891.',
  where: 'while locking tuple (0,15) in relation "menus"
    SQL statement "UPDATE mx_dic.menus
        SET sort_order = sort_order - 100
        WHERE sort_order <= NEW.sort_order
          AND sort_order > OLD.sort_order
          AND id <> NEW.id"
    PL/pgSQL function mx_dic.fn_menus_bu_sort_order_reorder() line 20 at SQL statement'
```

### Технічний аналіз

#### Тригер `fn_menus_bu_sort_order_reorder`

У таблиці `mx_dic.menus` є BEFORE UPDATE тригер, який при зміні `sort_order` одного запису автоматично перерозподіляє `sort_order` сусідніх записів:

```sql
-- При переміщенні вгору: зсуває елементи між NEW та OLD вниз (+100)
UPDATE mx_dic.menus
SET sort_order = sort_order + 100
WHERE sort_order >= NEW.sort_order
  AND sort_order < OLD.sort_order
  AND id <> NEW.id;

-- При переміщенні вниз: зсуває елементи між OLD та NEW вгору (-100)
UPDATE mx_dic.menus
SET sort_order = sort_order - 100
WHERE sort_order <= NEW.sort_order
  AND sort_order > OLD.sort_order
  AND id <> NEW.id;
```

#### Механізм deadlock

`reorderMenusAction` запускав усі UPDATE паралельно через `Promise.all()`:

```typescript
// БУЛО (помилково)
await Promise.all(reorderedMenus.map((menu) => updateMenuSortOrder(menu.id, menu.sort_order)));
```

При перетаскуванні N меню запускались N паралельних `UPDATE mx_dic.menus SET sort_order = ...`. Кожен UPDATE запускав тригер, який намагався заблокувати і оновити **ті самі рядки**, що вже заблоковані іншим паралельним UPDATE. Два процеси блокували одні й ті самі рядки в різному порядку — класичний взаємний deadlock.

```
Транзакція A (UPDATE menu id=1):
  → тригер намагається UPDATE menu id=2 (заблокована транзакцією B)

Транзакція B (UPDATE menu id=2):
  → тригер намагається UPDATE menu id=1 (заблокована транзакцією A)

→ PostgreSQL виявляє deadlock і кидає помилку 40P01
```

### Виправлення

Додано нову функцію `reorderMenusSortOrder` у `data/mx-dic/menus.ts`, яка виконує всі UPDATE **послідовно в одній транзакції** через одне підключення:

```typescript
export async function reorderMenusSortOrder(
  menus: Array<{ id: number; sort_order: number }>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const menu of menus) {
      await client.query(
        'UPDATE mx_dic.menus SET sort_order = $1, updated_at = now() WHERE id = $2',
        [menu.sort_order, menu.id]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[reorderMenusSortOrder] Помилка оновлення порядку меню:', error);
    throw new Error('Не вдалося оновити порядок меню');
  } finally {
    client.release();
  }
}
```

**`actions/mx-admin/menu/menus.ts`** — `reorderMenusAction` замінив `Promise.all` на нову функцію:

```typescript
// СТАЛО
await reorderMenusSortOrder(reorderedMenus);
```

Тепер усі UPDATE йдуть через одне підключення послідовно. Тригер отримує ексклюзивний доступ до таблиці, перерозподіляє сусідів без конкуренції, наступний UPDATE виконується вже з оновленими значеннями.

---

## Змінені файли

| Файл                                  | Зміна                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| `data/mx-system/nav-user-sections.ts` | `ORDER BY` додано `menu_sort_order, menu_id`                                    |
| `data/mx-system/nav-user-items.ts`    | `ORDER BY` додано `menu_sort_order, menu_id`                                    |
| `data/mx-dic/menus.ts`                | Додана функція `reorderMenusSortOrder`                                          |
| `actions/mx-admin/menu/menus.ts`      | `reorderMenusAction` використовує `reorderMenusSortOrder` замість `Promise.all` |

---

## Урок: Паралельні UPDATE з тригерами

**Правило**: якщо таблиця має BEFORE UPDATE тригер, що модифікує інші рядки тієї ж таблиці — **ніколи** не виконуй масові UPDATE паралельно через `Promise.all`. Завжди використовуй одну транзакцію з послідовними операціями.

Це стосується будь-яких сценаріїв з:

- тригерами перерозподілу `sort_order`
- тригерами підтримки сумарних полів (counter cache)
- тригерами каскадного оновлення

---

**Автор**: Claude Sonnet 4.6 + maxsa
