// Меню з рядковими назвами іконок (для передачі з Server Component в Client Component)
export const menuAdmin = {
  // Меню для адміністратора
  navAdminSections: [
    {
      title: 'Управління',
      url: '#',
      icon: 'Dot',
      isActive: true,
      items: [
        {
          id: 1101,
          title: 'Користувачі',
          icon: 'Shield',
          url: '/mx-admin/users',
        },
        {
          id: 1102,
          title: 'Персоналізація',
          icon: 'Users',
          url: '/mx-admin/user-data',
        },
        {
          id: 1103,
          title: 'Сесії',
          icon: 'ListChecks',
          url: '/mx-admin/sessions',
        },
      ],
    },
    {
      title: 'Структура',
      url: '#',
      icon: 'Dot',
      isActive: true,
      items: [
        {
          id: 1300,
          title: 'Філії',
          icon: 'HousePlus',
          url: '/mx-admin/offices',
        },
        {
          id: 1301,
          title: 'Меню',
          icon: 'Settings',
          url: '/mx-admin/menu-app',
        },
        {
          id: 1302,
          title: 'Повноваження',
          icon: 'Settings',
          url: '/mx-admin/permissions',
        },
        {
          id: 1303,
          title: 'Форми авторизації',
          icon: 'Settings',
          url: '/mx-admin/auth-pages',
        },
      ],
    },
  ],

  // Меню адміністратора з загальними пунктами
  navAdminItems: [] as Array<{
    id: number;
    name: string;
    url: string;
    icon: string;
  }>,
  // {
  //   id: 2101,
  //   name: 'Адмін пункт 1',
  //   url: '#',
  //   icon: 'Shield',
  // },
  // {
  //   id: 2102,
  //   name: 'Адмін пункт 2',
  //   url: '#',
  //   icon: 'Shield',
  // },
  // {
  //   id: 2103,
  //   name: 'Адмін пункт 3',
  //   url: '#',
  //   icon: 'Shield',
  // },
};

export const menuUser = {
  // Основна навігація для зареєстрованого адміністратора в просторі /mx-job
  navRegisteredAdminMxJob: [
    {
      id: 6201,
      title: 'Головна',
      url: '/',
      icon: 'Home',
    },
    {
      id: 6202,
      title: 'Адміністратор',
      url: '/mx-admin',
      icon: 'Shield',
    },
  ],

  // Основна навігація для зареєстрованого адміністратора в просторі /mx-admin
  navRegisteredAdminMxAdmin: [
    {
      id: 6203,
      title: 'Головна',
      url: '/',
      icon: 'Home',
    },
    {
      id: 6204,
      title: 'Робоча панель',
      url: '/mx-job',
      icon: 'LayoutDashboard',
    },
  ],

  // Основна навігація для зареєстрованого користувача в просторі /mx-job
  navRegisteredUserMxJob: [
    {
      id: 6205,
      title: 'Головна',
      url: '/',
      icon: 'Home',
    },
  ],

  // Пункт адмін-панелі для персонального меню (тільки для адміністраторів)
  navUserAdmin: {
    id: 6100,
    title: 'Управління',
    url: '/mx-admin',
    icon: 'LayoutDashboard',
  },

  // Меню користувача з профілем та налаштуваннями
  navUserProfile: [
    {
      id: 6101,
      title: 'Профіль',
      url: '/profile',
      icon: 'BadgeCheck',
    },
    {
      id: 6102,
      title: 'Платіжні дані',
      url: '/profile/payment-data',
      icon: 'CreditCard',
    },
    {
      id: 6103,
      title: 'Сповіщення',
      url: '/profile/notifications',
      icon: 'Bell',
    },
  ],
};

// Об'єкт, що об'єднує всі дані меню для зручного використання
export const data = {
  ...menuAdmin,
  ...menuUser,
  // Порожні масиви для динамічних меню (заповнюються з БД)
  navUserSections: [] as Array<{
    title: string;
    url: string;
    icon: string;
    isActive?: boolean;
    items?: Array<{
      id: number;
      title: string;
      url: string;
      icon: string;
    }>;
  }>,
  navUserItems: [] as Array<{
    id: number;
    name: string;
    url: string;
    icon: string;
  }>,
  // Меню підтримки тепер завантажується з БД, не статичне
  navAppSupport: [] as Array<{
    id: number;
    title: string;
    url: string;
    icon: string;
  }>,
};
