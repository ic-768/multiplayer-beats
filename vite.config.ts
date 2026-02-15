import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { Server as SocketIOServer } from "socket.io";
import { defineConfig, type ViteDevServer } from "vite";
import babel from "vite-plugin-babel";
import tsconfigPaths from "vite-tsconfig-paths";

import { setupSocketHandlers } from "./server/socket";

/**
 * Socket.IO plugin for development mode.
 *
 * This plugin attaches Socket.IO to Vite's development HTTP server.
 * It's only needed during development because:
 * - Dev: Vite creates its own server, so we need to plug into it
 * - Prod: server/index.ts creates its own Express server with Socket.IO
 *
 * In production, this plugin does nothing since it's not included
 * in the production build.
 */
const socketIOPlugin = {
  name: "socket-io",
  configureServer(server: ViteDevServer) {
    if (!server.httpServer) return;

    const io = new SocketIOServer(server.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    setupSocketHandlers(io);
    console.log("Socket.IO initialized");
  },
};

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    socketIOPlugin,
  ],
});
