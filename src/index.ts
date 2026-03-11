import { env } from "./env";
import express from "express";
import cors from "cors";
import swaggerUi from 'swagger-ui-express'
import { authRouter } from "./routes/auth.routes";
import { cardRouter } from "./routes/card.routes";
import { deckRouter } from "./routes/deck.routes";
import * as http from 'node:http'
import { ChatServer } from "./socket/ChatServer";


import { createServer } from 'http'
import { swaggerDocument } from './docs'

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

app.use(express.json())

// Serve static files (Socket.io test client)
app.use(express.static('public'))

// Swagger API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TCG API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
)

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "TCG Backend Server is running" });
});

app.use('/api/auth', authRouter)
app.use('/api/cards', cardRouter)
app.use('/api/decks', deckRouter)

// Create HTTP Server
export const server = http.createServer(app)

// Initialiser le serveur de chat avec Socket.io (inclut l'authentification)
new ChatServer(server)

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Start server
  try {
    server.listen(env.PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${env.PORT}`)
      console.log(
        `🧪 Socket.io Test Client available at http://localhost:${env.PORT}`,
      )
      console.log(`📚 API Documentation available at http://localhost:${env.PORT}/api-docs`)
    })
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
