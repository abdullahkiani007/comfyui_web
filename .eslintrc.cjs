/** @type {import("eslint").Linter.Config} */

module.exports = {
  plugins: ['@typescript-eslint'],

  extends: [
    'plugin:react/recommended',
    'plugin:promise/recommended',
    'plugin:sonarjs/recommended',
    'plugin:unicorn/recommended',
    'plugin:prettier/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:@typescript-eslint/recommended-type-checked'
  ],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    project: './tsconfig.json', // This ensures ESLint uses the correct tsconfig
    ecmaVersion: 'latest',
    sourceType: 'module'
  },

  settings: {
    react: {
      pragma: 'React',
      version: 'detect'
    }
  },

  ignorePatterns: ['**/*.html', '**/*.test.ts', '**/*.config.ts'],

  overrides: [
    {
      files: ['_config.ts', 'tailwind.config.ts', 'playwright.config.ts'],
      parserOptions: {
        project: './tsconfig.node.json' // Handle config files separately
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off' // Disable the unused-vars rule for config files
      }
    }
  ],

  rules: {
    // base
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'], // Use 'windows' for CRLF
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto'
      }
    ],

    // typescript
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports'
      }
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: { attributes: false }
      }
    ]
  }
};
