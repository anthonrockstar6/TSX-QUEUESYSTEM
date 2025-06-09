import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve React frontend static files from client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// For all other routes, serve index.html (React SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let queue = [];
let current = null;

const ADMIN_PASSWORD = 'admin123'; // Change this!

wss.on('connection', (ws) => {
  // Track if this connection is admin or not
  ws.isAdmin = false;

  // Send initial data
  ws.send(JSON.stringify({ type: 'init', queue, current }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Handle messages according to type
      switch (data.type) {
        case 'enqueue':
          queue.push({ number: data.number, counter: data.counter || null });
          if (!current) current = queue.shift();
          break;

        case 'admin_login':
          if (data.password === ADMIN_PASSWORD) {
            ws.isAdmin = true;
            ws.send(JSON.stringify({ type: 'admin_login_success' }));
          } else {
            ws.send(JSON.stringify({ type: 'admin_login_failed' }));
          }
          return; // no broadcast needed here

        // Admin-only actions:
        case 'next':
          if (ws.isAdmin) current = queue.shift() || null;
          break;

        case 'remove':
          if (ws.isAdmin) {
            queue = queue.filter(item => item.number !== data.number);
            if (current && current.number === data.number) current = null;
          }
          break;

        case 'clear_all':
          if (ws.isAdmin) {
            queue = [];
            current = null;
          }
          break;

        default:
          // Unknown message type
          break;
      }

      // Broadcast updated queue and current to all clients
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'update', queue, current }));
        }
      });

    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  (async () => {
    const os = await import('os');
    const interfaces = os.networkInterfaces();
    const localIP = Object.values(interfaces)
      .flat()
      .find(i => i.family === 'IPv4' && !i.internal)?.address;

    console.log(`✅ Server running at: http://${localIP}:${PORT}`);
  })();
});
