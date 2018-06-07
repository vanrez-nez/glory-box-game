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
  extends: ['airbnb-base'],
  // required to lint *.vue files
  plugins: [],
  // check if imports actually resolve
  settings: {
    'import/resolver': {
      webpack: {
        config: 'build/webpack.base.conf.js'
      }
    }
  },
  globals: {
    'THREE': false,
    'TweenMax': false,
    'TimelineMax': false,
    'MeshLine': false,
    'MeshLineMaterial': false,
    'Power1': false,
    'Power2': false,
    'Power3': false,
    'Power4': false,
    'Back': false,
    'Expo': false,
    'ThreeBSP': false,
    'EventEmitter3': false,
    'Stats': false,
    'dat': false,
    'Simple1DNoise': false,
    'kdTree': false,
    'rbush': false,
    'deepmerge': false,
    'MainLoop': false
  },
  // add your custom rules here
  rules: {
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

    "indent": [2],
    "no-bitwise": 0,
    "no-mixed-operators": 0,
    "no-console": "warn",
    "no-plusplus": 0,
    "no-param-reassign": 0,
    "class-methods-use-this": "warn",
    "no-unused-vars": "warn",
    "spaced-comment": "warn",
    "class-methods-use-this": 0,
    "no-multi-spaces": 0,
    "key-spacing": 0,
    "no-unused-expressions": 0,
    "no-else-return": 0,
    "consistent-return ": 0,
    "default-case": 0,
    "no-continue": 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  }
}
