/**
 * Production server entry point.
 *
 * This file is used when running `npm run start` (production mode).
 * For development, Socket.IO is injected via the socketIOPlugin in vite.config.ts.
 *
 * The server:
 * 1. Sets up Express with compression and logging
 * 2. Initializes Socket.IO for real-time multiplayer sync
 * 3. Serves static assets from the client build
 * 4. Handles all other requests via the React Router SSR build
 */

import compression from "compression";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { Server as SocketIOServer } from "socket.io";

import { setupSocketHandlers } from "./socket/index.js";

const app = express();
const server = createServer(app);

// Initialize Socket.IO with CORS allowed for all origins
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Set up socket event handlers for room management and game sync
setupSocketHandlers(io);

// Express middleware
app.use(compression());
app.disable("x-powered-by");

// Serve hashed assets with long cache (1 year)
app.use(
  "/assets",
  express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
);
app.use(morgan("tiny"));
// Serve other static files with short cache (1 hour)
app.use(express.static("build/client", { maxAge: "1h" }));

// Import the React Router SSR handler from the build output
// @ts-expect-error - build output doesn't have types
const build = await import("../build/server/index.js");
app.use(build.app);

const PORT = Number.parseInt(process.env.PORT || "3000");
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
