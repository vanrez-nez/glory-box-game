// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    browser: true,
    es2022: true,
  },
  extends: ['plugin:vue/vue3-essential', 'airbnb-base'],
  plugins: ['vue'],
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src'],
          ['@styles', './src/styles'],
          // three's `exports` map (./addons/* -> examples/jsm/*) isn't followed
          // by the import resolver, so map it explicitly to the real files.
          ['three/addons', './node_modules/three/examples/jsm'],
        ],
        extensions: ['.js', '.vue', '.json'],
      },
    },
  },
  rules: {
    // Off: the codebase mixes extensionless local imports with three/addons/*.js
    // imports that must keep their explicit extension (per three's exports map).
    'import/extensions': 0,
    // allow optionalDependencies
    'import/no-extraneous-dependencies': ['error', {
      optionalDependencies: ['test/unit/index.js'],
    }],
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    indent: [2],
    'arrow-parens': 0,
    'vue/multi-word-component-names': 0,
    // Formatting rules relaxed to match the existing code style
    // (newer/stricter in airbnb-base 15 than the original airbnb-base 11).
    'function-paren-newline': 0,
    'function-call-argument-newline': 0,
    'lines-between-class-members': 0,
    'operator-linebreak': 0,
    'no-multiple-empty-lines': 0,
    'prefer-destructuring': 0,
    'grouped-accessor-pairs': 0,
    'no-bitwise': 0,
    'no-mixed-operators': 0,
    'no-console': 'warn',
    'no-plusplus': 0,
    'no-param-reassign': 0,
    'class-methods-use-this': 0,
    'no-unused-vars': 'warn',
    'spaced-comment': 'warn',
    'no-multi-spaces': 0,
    'key-spacing': 0,
    'no-unused-expressions': 0,
    'no-else-return': 0,
    'default-case': 0,
    'no-continue': 0,
    'prefer-rest-params': 0,
    'object-curly-newline': 0,
    'object-property-newline': 0,
  },
  globals: {},
};
