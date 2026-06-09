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
        ],
        extensions: ['.js', '.vue', '.json'],
      },
    },
  },
  rules: {
    // don't require .vue extension when importing
    'import/extensions': ['error', 'always', {
      js: 'never',
      vue: 'never',
    }],
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
  globals: {
    THREE: false,
    EventEmitter3: false,
    TweenMax: false,
    TimelineMax: false,
    Power1: false,
    Power2: false,
    Power3: false,
    Power4: false,
    Back: false,
    Expo: false,
    ThreeBSP: false,
    Simple1DNoise: false,
  },
};
