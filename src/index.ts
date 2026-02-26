import { env } from "./env";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { cardRouter } from "./routes/card.routes";
import { deckRouter } from "./routes/deck.routes";
import * as http from 'node:http'
import { ChatServer } from "./socket/ChatServer";



// Create Express app
export const app = express();

// Create Server
export const server = http.createServer(app);

// Initialiser le serveur de chat avec la classe (inclut l'authentification)
new ChatServer(server);

// Middlewares
app.use(
  cors({
    origin: true,  // Autorise toutes les origines
    credentials: true,
  }),
);

app.use(express.json());

// Serve static files (Socket.io test client)
app.use(express.static('public'));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "TCG Backend Server is running" });
});

app.use("/api/auth", authRouter);
app.use('/api/cards', cardRouter);
app.use('/api/decks', deckRouter);

// Start server only if this file is run directly (not imported for tests)
if (require.main === module) {
  // Start server
  try {
    server.listen(env.PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${env.PORT}`);
      console.log(`🧪 Socket.io Test Client available at http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
