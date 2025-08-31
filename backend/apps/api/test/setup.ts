import { register } from 'tsconfig-paths';

// Register TypeScript path aliases for Jest
register({
  baseUrl: './src',
  paths: {
    '@/*': ['*'],
    '@utils/*': ['../../packages/utils/*'],
  },
});

console.log('🔧 Jest setup: TypeScript path aliases registered');
console.log('🔧 Base URL:', './src');
console.log('🔧 Paths:', {
  '@/*': ['*'],
  '@utils/*': ['../../packages/utils/*'],
});
