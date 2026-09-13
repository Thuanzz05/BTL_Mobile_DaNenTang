import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'uploads/**', '.vs/**'],
  },
  {
    files: ['src/**/*.ts', 'scripts/**/*.js', 'migrations/**/*.js', 'tests/**/*.cjs'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-debugger': 'error',
      'no-constant-condition': 'error',
    },
  },
];
