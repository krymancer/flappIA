import js from '@eslint/js';

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        Image: 'readonly',
        requestAnimationFrame: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: { global: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' },
    },
  },
];
