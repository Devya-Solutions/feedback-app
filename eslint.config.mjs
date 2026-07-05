// ESLint 9 flat config.
// `eslint-config-next` v16 ships flat-config-compatible exports, so we
// import them directly instead of using FlatCompat.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // The React Compiler-era hooks rules are new in eslint-config-next 16
      // and flag long-standing patterns; surface them as warnings for now.
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      // Noisy on existing code; keep visible without failing the build.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'out/**',
      'public/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },
];

export default config;
