/**
 * Debugging:
 *   https://eslint.org/docs/latest/use/configure/debug
 *  ----------------------------------------------------
 *
 *   Print a file's calculated configuration
 *
 *     npx eslint --print-config path/to/file.js
 *
 *   Inspecting the config
 *
 *     npx eslint --inspect-config
 *
 */
import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';
import decoratorPositionConfig from 'eslint-plugin-decorator-position/config/recommended';
import ember from 'eslint-plugin-ember/recommended';
import n from 'eslint-plugin-n';
import prettier from 'eslint-plugin-prettier/recommended';
import qunit from 'eslint-plugin-qunit';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import ts from 'typescript-eslint';

const parserOptions = {
  esm: {
    js: {
      ecmaFeatures: { modules: true },
      ecmaVersion: 'latest',
      requireConfigFile: false,
      babelOptions: {
        plugins: [
          [
            '@babel/plugin-proposal-decorators',
            { decoratorsBeforeExport: true },
          ],
        ],
      },
    },
    ts: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
};

export default ts.config(
  js.configs.recommended,
  ember.configs.base,
  ember.configs.gjs,
  ember.configs.gts,
  prettier,
  decoratorPositionConfig,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            [
              '^ember$',
              '^@glimmer',
              '^@ember',
              '^ember-cli-htmlbars',
              '^qunit',
              '^ember-qunit',
              '^@embroider',
              '^@embroider',
              '^node:',
            ],
            ['^@?\\w'],
            ['^'],
            ['^emberclear', '^pinochle', '^limber'],
            ['^@emberclear', '^@limber', '@glimdown'],
            ['/test-support'],
            ['^\\.'],
            ['^.+\\u0000$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
  /**
   * Ignores must be in their own object
   * https://eslint.org/docs/latest/use/configure/ignore
   */
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '!**/.*'],
  },
  /**
   * https://eslint.org/docs/latest/use/configure/configuration-files#configuring-linter-options
   */
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelParser,
    },
  },
  {
    files: ['**/*.{js,gjs}'],
    languageOptions: {
      parserOptions: parserOptions.esm.js,
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.{ts,gts}'],
    languageOptions: {
      parser: ember.parser,
      parserOptions: parserOptions.esm.ts,
    },
    extends: [...ts.configs.recommendedTypeChecked, ember.configs.gts],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['tests/**/*-test.{js,gjs,ts,gts}'],
    plugins: {
      qunit,
    },
  },
  /**
   * CJS node files
   */
  {
    files: [
      '**/*.cjs',
      'config/**/*.js',
      'testem.js',
      'testem*.js',
      '.prettierrc.js',
      '.stylelintrc.js',
      '.template-lintrc.js',
      'ember-cli-build.js',
    ],
    plugins: {
      n,
    },

    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
  },
  /**
   * ESM node files
   */
  {
    files: ['**/*.mjs'],
    plugins: {
      n,
    },

    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: parserOptions.esm.js,
      globals: {
        ...globals.node,
      },
    },
  },
);
