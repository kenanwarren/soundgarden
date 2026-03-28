import js from '@eslint/js'
import babelParser from '@babel/eslint-parser'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

const parserOptions = {
  requireConfigFile: false,
  babelOptions: {
    babelrc: false,
    configFile: false,
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }],
      ['@babel/preset-typescript', { allExtensions: true, isTSX: true }]
    ]
  },
  ecmaVersion: 'latest',
  sourceType: 'module'
}

const sharedGlobals = {
  ...globals.browser,
  ...globals.node
}

export default [
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'out/**',
      'playwright-report/**',
      'test-results/**'
    ]
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions,
      globals: sharedGlobals
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-undef': 'off',
      'no-unused-vars': 'off'
    }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions,
      globals: sharedGlobals
    },
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules
    }
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions,
      globals: {
        ...sharedGlobals,
        ...globals.vitest
      }
    }
  }
]
