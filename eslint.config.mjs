import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Глобальні ігнори за замовчуванням
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'temp/**', // Тимчасові файли та архіви
  ]),
  // Додаткові правила (next/core-web-vitals вже включає React, React Hooks та jsx-a11y)
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React 19 не потребує імпорту React
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // TypeScript правила
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React hooks та accessibility правила вже включені в nextVitals
      // Додаткові налаштування не потрібні
    },
  },
])

export default eslintConfig
