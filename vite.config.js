import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	base: './',
	build: {
		outDir: 'dist',
		target: 'esnext',
	},
	preview: {
		port: 5173,
		strictPort: true,
		host: '0.0.0.0', 
		allowedHosts: true,
	},
	server: {
		allowedHosts: true,
		historyApiFallback: true,
	},
});
