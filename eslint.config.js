/**
 * إعداد ESLint (flat config) — فحص آلي لقواعد React والخطافات والنوع.
 *
 * السياسة:
 *  - أي **خطأ** يُفشل `npm run eslint` والـ CI.
 *  - التحذيرات مسموحة بسقف صريح (`--max-warnings` في `package.json`) فلا تتضخّم بصمت.
 *  - لا تُعطَّل قاعدة بـ `eslint-disable` بدون سبب مكتوب في تعليق على السطر نفسه.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'node_modules/**',
      'legacy/**',
      'docs/تدقيق/**',
      'coverage/**',
      '*.config.js',
      'eslint.config.js',
      'tools/**',
      'legacy/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        indexedDB: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        print: 'readonly',
        Audio: 'readonly',
        Notification: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        DOMException: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        ServiceWorkerRegistration: 'readonly',
      },
    },
    rules: {
      /* أخطاء حقيقية — تُفشل البوابة */
      'react-hooks/rules-of-hooks': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-debugger': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',

      /* تحذيرات — تُتابع بسقف ولا تُفشل */
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'warn',
    },
  },
  {
    files: ['tools/**/*.mjs', 'tests/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
