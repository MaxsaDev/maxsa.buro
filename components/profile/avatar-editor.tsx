'use client';

import { deleteAvatarAction, uploadAvatarAction } from '@/actions/profile/avatar';
import { buildAvatarUrl } from '@/lib/avatar/build-avatar-url';
import { cn } from '@/lib/utils';
import { Camera, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AvatarEditorProps {
  /** URL аватара користувача (може бути null) */
  imageUrl: string | null | undefined;
  /** Ім'я користувача для fallback */
  userName: string;
  /** Розмір аватара */
  size?: 'sm' | 'md' | 'lg';
  /** Чи можна редагувати аватар */
  editable?: boolean;
}

export function AvatarEditor({
  imageUrl,
  userName,
  size = 'lg',
  editable = true,
}: AvatarEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Розміри аватара
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  // Формуємо URL для відображення
  const displayUrl = previewUrl || buildAvatarUrl(imageUrl);

  // Обробка вибору файлу
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Валідація розміру
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Розмір файлу не повинен перевищувати 5 МБ');
      return;
    }

    // Валідація типу
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Дозволені формати: JPEG, PNG, WebP, GIF');
      return;
    }

    setSelectedFile(file);

    // Створюємо preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Завантаження аватара
  const handleUpload = () => {
    if (!selectedFile) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const result = await uploadAvatarAction(formData);

        if (result.status === 'success') {
          toast.success(result.message);
          setSelectedFile(null);
          setPreviewUrl(null);
          // Використовуємо повне оновлення сторінки для оновлення сесії Better Auth
          window.location.reload();
        } else {
          toast.error(result.message);
          setPreviewUrl(null);
          setSelectedFile(null);
        }
      } catch (error) {
        console.error('[AvatarEditor] Помилка завантаження аватара:', error);
        toast.error('Несподівана помилка при завантаженні аватара');
        setPreviewUrl(null);
        setSelectedFile(null);
      }
    });
  };

  // Видалення аватара
  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteAvatarAction();

        if (result.status === 'success') {
          toast.success(result.message);
          setShowDeleteDialog(false);
          // Використовуємо повне оновлення сторінки для оновлення сесії Better Auth
          window.location.reload();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('[AvatarEditor] Помилка видалення аватара:', error);
        toast.error('Несподівана помилка при видаленні аватара');
      }
    });
  };

  // Отримуємо ініціали для fallback
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!editable) {
    return (
      <Avatar className={cn(sizeClasses[size])}>
        {displayUrl ? (
          <AvatarImage src={displayUrl} alt={userName} />
        ) : (
          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
        )}
      </Avatar>
    );
  }

  return (
    <>
      <div className="relative inline-block">
        <Avatar
          className={cn(
            sizeClasses[size],
            'ring-offset-background cursor-pointer ring-2 ring-offset-2'
          )}
        >
          {displayUrl ? (
            <AvatarImage key={imageUrl || 'no-image'} src={displayUrl} alt={userName} />
          ) : (
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          )}
        </Avatar>

        {/* Overlay з кнопками */}
        {!previewUrl && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isPending}
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                disabled={isPending}
                title={imageUrl ? 'Замінити аватар' : 'Завантажити аватар'}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isPending}
                  title="Видалити аватар"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Preview з кнопками завантаження/скасування */}
        {previewUrl && selectedFile && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-black/80">
            <div className="flex flex-col items-center gap-2">
              <div className="relative h-16 w-16 overflow-hidden rounded-full">
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="default"
                  className="h-8 w-8"
                  onClick={handleUpload}
                  disabled={isPending}
                  title="Завантажити"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  disabled={isPending}
                  title="Скасувати"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Діалог підтвердження видалення */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити аватар?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити аватар? Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Видалення...' : 'Видалити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
