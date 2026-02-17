'use client';

/**
 * ⚠️ React Compiler Notice:
 * TanStack Table v8 використовує useReactTable(), який повертає функції що не можуть
 * бути безпечно мемоізовані. React Compiler автоматично пропускає мемоізацію цього
 * компонента. Це очікувана поведінка і не впливає на функціональність.
 *
 * Детальніше: https://github.com/TanStack/table/discussions/5280
 * Оновлення TanStack Table для повної сумісності очікується в майбутніх версіях.
 */

import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';

import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserView } from '@/interfaces/public/user-view';
import { rankItem } from '@tanstack/match-sorter-utils';
import { useState } from 'react';
import { DataTablePagination } from '../../data-table-pagination';

interface Props {
  columns: ColumnDef<UserView>[];
  data: UserView[];
}

/**
 * Стандартна функція нечіткого фільтру (fuzzy) для глобального пошуку в таблиці
 */
const fuzzyFilter: FilterFn<UserView> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({
    itemRank,
  });
  return itemRank.passed;
};

/**
 * Таблиця користувачів з глобальним пошуком та пагінацією
 *
 * Next.js 16 + React Compiler:
 * Цей компонент не мемоізується автоматично через обмеження TanStack Table.
 * Це не впливає на продуктивність, оскільки компонент оптимізований вручну.
 */
export function DataTable({ columns, data }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Видимі колонки
    iconStatus: true,
    image: true,
    name: true,
    email: true,
    actions: true,

    // Приховані колонки (використовуються для пошуку та внутрішньої логіки)
    id: false,
    full_name: false,
    email_verified: false,
    role: false,
    is_banned: false,
    two_factor_enabled: false,
    has_passkey: false,
    created_at: false,
    updated_at: false,
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 поки не повністю сумісний з React Compiler
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 100,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Пошук по імені, повному імені або email..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-md"
        />
        <div className="text-muted-foreground text-sm">
          Знайдено: {table.getFilteredRowModel().rows.length} з {data.length}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Немає результатів.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
