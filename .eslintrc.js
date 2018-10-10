// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
  // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
  extends: ['plugin:vue/essential', 'airbnb-base'],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // check if imports actually resolve
  settings: {
    'import/resolver': {
      webpack: {
        config: 'build/webpack.base.conf.js'
      }
    }
  },
  // add your custom rules here
  rules: {
    // don't require .vue extension when importing
    'import/extensions': ['error', 'always', {
      js: 'never',
      vue: 'never'
    }],
    // disallow reassignment of function parameters
    // disallow parameter object manipulation except for specific exclusions
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: [
        'state', // for vuex state
        'acc', // for reduce accumulators
        'e' // for e.returnvalue
      ]
    }],
    // allow optionalDependencies
    'import/no-extraneous-dependencies': ['error', {
      optionalDependencies: ['test/unit/index.js']
    }],
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'indent': [2],
    'no-bitwise': 0,
    'no-mixed-operators': 0,
    'no-console': 'warn',
    'no-plusplus': 0,
    'no-param-reassign': 0,
    'class-methods-use-this': 'warn',
    'no-unused-vars': 'warn',
    'spaced-comment': 'warn',
    'class-methods-use-this': 0,
    'no-multi-spaces': 0,
    'key-spacing': 0,
    'no-unused-expressions': 0,
    'no-else-return': 0,
    'consistent-return ': 0,
    'default-case': 0,
    'no-continue': 0,
    'prefer-rest-params': 0,
    'object-curly-newline': 0,
  },
  globals: {
    'THREE': false,
    'EventEmitter3': false,
    'TweenMax': false,
    'TimelineMax': false,
    'Power1': false,
    'Power2': false,
    'Power3': false,
    'Power4': false,
    'Back': false,
    'Expo': false,
    'ThreeBSP': false,
    'Simple1DNoise': false,
  },
}
