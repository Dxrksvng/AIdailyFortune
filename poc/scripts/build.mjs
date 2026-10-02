import { build } from 'esbuild';
await build({ entryPoints: ['public/scene.js'], outfile: 'public/scene.bundle.js', bundle: true, format: 'esm', minify: true, target: 'es2022', logLevel: 'warning' });
