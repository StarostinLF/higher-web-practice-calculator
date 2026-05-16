import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss()],
	base: '/higher-web-practice-calculator/',
	server: {
		port: 3000,
	},
	build: {
		outDir: 'dist',
		sourcemap: true,
	},
	optimizeDeps: {
		include: ['idb', 'date-fns', 'zod'],
	},
});
