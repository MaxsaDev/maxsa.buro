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
import { rankItem } from '@tanstack/match-sorter-utils';
import { BriefcaseBusiness, Plus, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataTablePagination } from '@/components/tables/data-table-pagination';
import type { ClientView } from '@/interfaces/mx-data/client-view';
import type { ClientFilter } from '@/data/mx-data/clients';

interface Props {
  columns: ColumnDef<ClientView>[];
  data: ClientView[];
}

/**
 * Стандартна функція нечіткого фільтру (fuzzy) для глобального пошуку
 */
const fuzzyFilter: FilterFn<ClientView> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

/**
 * Таблиця клієнтів з пошуком, фільтрацією та пагінацією
 *
 * Next.js 16 + React Compiler:
 * Цей компонент не мемоізується автоматично через обмеження TanStack Table.
 */
export function ClientsDataTable({ columns, data }: Props) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [legalFilter, setLegalFilter] = useState<ClientFilter>('all');

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Видимі колонки
    full_name: true,
    contact_value: true,
    has_legal: true,
    actions: true,

    // Приховані колонки (для пошуку або внутрішньої логіки)
    user_name: false,
    user_data_id: false,
    contact_type_code: false,
    created_at: false,
  });

  // Фільтрація за типом клієнта (фізична / юридична особа)
  const filteredData = data.filter((client) => {
    if (legalFilter === 'legal') return client.has_legal;
    if (legalFilter === 'natural') return !client.has_legal;
    return true;
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 поки не повністю сумісний з React Compiler
  const table = useReactTable({
    data: filteredData,
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
        pageSize: 25,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Верхня панель: пошук + фільтр + кнопка */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <Input
            placeholder="Пошук за іменем, псевдонімом або контактом..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <ToggleGroup
            type="single"
            variant="outline"
            value={legalFilter}
            onValueChange={(value) => {
              if (value) setLegalFilter(value as ClientFilter);
            }}
          >
            <ToggleGroupItem value="all" aria-label="Всі клієнти">
              <Users className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="natural" aria-label="Фізичні особи">
              <User className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="legal" aria-label="Юридичні особи">
              <BriefcaseBusiness className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-muted-foreground text-sm">
            {table.getFilteredRowModel().rows.length} з {filteredData.length}
          </div>
          <Button size="sm" onClick={() => router.push('/mx-job/clients/new')}>
            <Plus className="size-4" />
            Новий клієнт
          </Button>
        </div>
      </div>

      {/* Таблиця */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/mx-job/clients/${row.original.user_data_id}`)}
                >
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
