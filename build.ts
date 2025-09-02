import { build } from 'bun';

console.log('🔨 Building Tower Defense Game...');

try {
  await build({
    entrypoints: ['./src/game/tower-defense-game.ts'],
    outdir: './dist',
    target: 'browser',
    format: 'esm',
    splitting: true,
    sourcemap: 'external',
    minify: false, // デバッグ用にminifyを無効化
  });

  console.log('✅ Build completed successfully!');
  console.log('📁 Output directory: ./dist');
  console.log('🌐 Open index.html in your browser to play the game');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}