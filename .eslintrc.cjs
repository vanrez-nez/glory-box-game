// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  extends: [
    'plugin:vue/vue3-essential',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    'no-console': 'warn',
    'no-unused-expressions': 0,
    '@typescript-eslint/no-unused-expressions': 0,
    'no-plusplus': 0,
    'no-bitwise': 0,
    'no-param-reassign': 0,
    // TS handles undefined vars; use the TS-aware unused-vars rule (lenient)
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // The game makes heavy, dynamic use of `any` and non-null assertions.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'vue/multi-word-component-names': 0,
  },
};
