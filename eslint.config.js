import pluginVue from 'eslint-plugin-vue';
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        google: 'readonly',
        // Globais de testes (Vitest)
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      'vue/no-unused-vars': ['warn', { 'ignorePattern': '^_' }],
      'vue/multi-word-component-names': 'off', // Permite nomes de componente como Terms.vue ou App.vue
      'vue/no-v-html': 'off', // Permite o uso de v-html se necessário para mensagens formatadas
      'no-console': 'off', // Permite logs
      'no-debugger': 'warn',
    }
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'tests/coverage/**',
    ]
  }
];
