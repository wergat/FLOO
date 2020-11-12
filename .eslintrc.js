/* eslint-disable linebreak-style */
module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    // 'eslint:recommended',
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    // 'plugin:vue/vue3-recommended',
    'plugin:vue/base',
    'plugin:vue/recommended', // Use this if you are using Vue.js 2.x.

  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 6,
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // override/add rules settings here, such as:
    // 'vue/no-unused-vars': 'error'
    'linebreak-style': 0,
    'max-len': [2, 150, 2, {
      ignoreUrls: true,
      ignoreComments: true,
    }],
    'no-constant-condition': ['error', { checkLoops: false }],
    'import/prefer-default-export': 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-param-reassign': ['warn', { props: false }],
    'max-classes-per-file': ['warn', 1],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
