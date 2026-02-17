'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { menuIconMap } from '@/lib/icon/get-menu-icon';
import { cn } from '@/lib/utils';
import { MenuIcon } from './menu-icon';

interface IconPickerNewProps {
  /** Поточна назва іконки */
  currentIcon: string;
  /** Callback при виборі іконки */
  onSelect: (iconName: string) => void;
  /** Чи заблоковано вибір */
  disabled?: boolean;
}

/**
 * Компонент для вибору іконки з бібліотеки Lucide для нових записів
 * Popover з пошуком та сіткою іконок
 */
export function IconPickerNew({ currentIcon, onSelect, disabled = false }: IconPickerNewProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Отримуємо список доступних іконок з мапи (без Dot)
  const availableIcons = Object.keys(menuIconMap).filter((iconName) => iconName !== 'Dot');

  // Фільтруємо іконки за пошуковим запитом
  const filteredIcons = availableIcons.filter((iconName) =>
    iconName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Обробка вибору іконки
  const handleSelectIcon = (iconName: string) => {
    onSelect(iconName);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          className="size-8 shrink-0"
          aria-label="Вибрати іконку"
        >
          <MenuIcon iconName={currentIcon} className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] p-2">
        {/* Поле пошуку */}
        <div className="relative mb-2">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Пошук іконки..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="bg-muted/50 placeholder:text-muted-foreground focus:ring-ring w-full rounded-md py-1.5 pr-3 pl-8 text-sm outline-none focus:ring-1"
          />
        </div>

        {/* Сітка іконок */}
        <div className="max-h-[240px] overflow-y-auto">
          {filteredIcons.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm">Іконки не знайдено</div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {filteredIcons.map((iconName) => {
                const isSelected = iconName === currentIcon;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleSelectIcon(iconName)}
                    disabled={disabled}
                    className={cn(
                      'hover:bg-accent flex size-9 items-center justify-center rounded-md transition-colors',
                      isSelected && 'bg-primary/10 text-primary ring-primary/30 ring-1',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                    aria-label={`Вибрати іконку ${iconName}`}
                  >
                    <MenuIcon iconName={iconName} className="size-4" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
