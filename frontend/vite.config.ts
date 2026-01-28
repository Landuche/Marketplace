import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '../', '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      sentryVitePlugin({
        org: 'daniel-rodrigues-landuche',
        project: 'marketplace-frontend',
        authToken: env.VITE_SENTRY_AUTH,
        sourcemaps: {
          filesToDeleteAfterUpload: './dist/assets/*.map',
        },
      }),
    ],
    build: {
      sourcemap: true,
    },
  };
});