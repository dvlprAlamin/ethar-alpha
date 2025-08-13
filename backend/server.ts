/**
 * local server entry file, for local development
 */
import { createServer } from 'http';
import app from './app.js';
import WebSocketServer from './websocket.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  console.log(`WebSocket server initialized`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  wsServer.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  wsServer.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export WebSocket server instance for use in other modules
export { wsServer };

export default app; // Restart trigger
