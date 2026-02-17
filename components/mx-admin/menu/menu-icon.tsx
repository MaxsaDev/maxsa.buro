/* eslint-disable react-hooks/static-components */
'use client';

import { getMenuIcon } from '@/lib/icon/get-menu-icon';

interface MenuIconProps {
  iconName: string;
  className?: string;
}

export function MenuIcon({ iconName, className }: MenuIconProps) {
  // getMenuIcon повертає компонент зі статичної мапи, не створює новий компонент
  const IconComponent = getMenuIcon(iconName);
  return <IconComponent className={className} />;
}
