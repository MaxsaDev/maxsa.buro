'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';

interface SortableMenuWrapperProps {
  items: Array<{ id: number; sort_order: number }>;
  onReorder: (items: Array<{ id: number; sort_order: number }>) => Promise<void>;
  children: React.ReactNode;
}

export function SortableMenuWrapper({ items, onReorder, children }: SortableMenuWrapperProps) {
  const [localItems, setLocalItems] = useState(items);
  const [isUpdating, setIsUpdating] = useState(false);

  // Синхронізуємо локальний стан з пропсами
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || isUpdating) {
      return;
    }

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistic update
    const newItems = arrayMove(localItems, oldIndex, newIndex);
    const reindexedItems = newItems.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));

    setLocalItems(reindexedItems);

    try {
      setIsUpdating(true);
      await onReorder(reindexedItems);
      toast.success('Порядок успішно оновлено');
    } catch (error) {
      // Rollback при помилці
      setLocalItems(items);
      toast.error('Помилка при оновленні порядку');
      console.error('Reorder error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={localItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}
