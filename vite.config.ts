import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

// Версию берём прямо из package.json на этапе сборки и подставляем в интерфейс,
// чтобы она не расходилась с релизом.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// base: './' нужен, чтобы собранный index.html ссылался на ассеты относительно,
// иначе при загрузке через file:// в Electron ничего не подхватится.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
});
