import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // TYPE RULES: a project of this type may import projects of these types
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:data-access',
                'type:ui',
                'type:domain',
                'type:util',
                'type:api',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:ui',
                'type:domain',
                'type:util',
                'type:api',
              ],
            },
            {
              sourceTag: 'type:api',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:ui',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            // SCOPE RULES: the context map. A scope may import itself, shared, and a type:api library
            {
              sourceTag: 'scope:ward',
              onlyDependOnLibsWithTags: [
                'scope:ward',
                'scope:monitoring',
                'scope:medication',
                'scope:patient',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:pharmacy',
              onlyDependOnLibsWithTags: [
                'scope:pharmacy',
                'scope:shared',
                'type:api',
              ],
            },
            {
              sourceTag: 'scope:monitoring',
              onlyDependOnLibsWithTags: [
                'scope:monitoring',
                'scope:shared',
                'type:api',
              ],
            },
            {
              sourceTag: 'scope:medication',
              onlyDependOnLibsWithTags: [
                'scope:medication',
                'scope:shared',
                'type:api',
              ],
            },
            {
              sourceTag: 'scope:patient',
              onlyDependOnLibsWithTags: ['scope:patient', 'scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {
      // unused parameters are kept when they document a signature (e.g. v22's CanMatchFn)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
];
