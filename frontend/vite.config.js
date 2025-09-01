import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api": {
        target: "http://i13c101.p.ssafy.io:18000",
        changeOrigin: true,
        secure: true,
      },
      "/ws": {
        target: "ws://i13c105.p.ssafy.io:18000",
        ws: true,
        changeOrigin: true,
        timeout: 60000,
        proxyTimeout: 60000,
        // 연결 오류 시 재시도
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('WebSocket proxy error:', err);
          });
          proxy.on('proxyReqWs', (_, req) => {
            console.log('WebSocket proxy request:', req.url);
          });
        }
      },
    },
  },
});