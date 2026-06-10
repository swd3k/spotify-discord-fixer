import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base: './' нужен, чтобы собранный index.html ссылался на ассеты относительно,
// иначе при загрузке через file:// в Electron ничего не подхватится.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
});
