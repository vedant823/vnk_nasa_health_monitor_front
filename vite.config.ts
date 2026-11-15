// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The backend's CORS config only allows http://localhost:5173, so the port is fixed.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
});
