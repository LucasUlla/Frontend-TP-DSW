import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default tseslint.config(
  { ignores: ['dist'] },
  ...compat.extends('airbnb', 'airbnb-typescript', 'airbnb/hooks'),
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Airbnb es estricto con esto y Tailwind/JSX moderno choca con algunas reglas puntuales;
      // relajamos las que más friccionan sin perder el espíritu de la guía
      'react/jsx-props-no-spreading': 'off', // lo necesitás para {...register('campo')}
      'react/react-in-jsx-scope': 'off', // no hace falta con el JSX transform nuevo
      'import/prefer-default-export': 'off',
    },
  },
)