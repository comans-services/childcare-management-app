import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - group external dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
          ],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-forms': ['react-hook-form', 'zod'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],

          // Feature chunks - group by app sections
          // These will be loaded on-demand when routes are accessed
        },
        // Organize asset files
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          const extType = name.split('.').at(-1) || '';

          // Organize images
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }

          // Organize fonts
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }

          // Default for other assets
          return 'assets/[name]-[hash][extname]';
        },
        // Organize chunk files
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Chunk size warning limit (increased from default 500kb)
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Inline assets smaller than 4kb as base64
    assetsInlineLimit: 4096,
    // Source maps for production debugging (optional, can disable for smaller builds)
    sourcemap: mode === 'development',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
}));
