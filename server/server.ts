import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';

// Load env variables from parent directory .env
dotenv.config({ path: '../.env' });

const app = express();
const httpServer = createServer(app);

// Enable CORS for Next.js app (http://localhost:3000)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Main status route
app.get('/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'MLN Stateful Core',
    timestamp: new Date().toISOString(),
    websockets: io.engine.clientsCount
  });
});

// Register routes
app.use('/api', apiRouter);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket Lobbies and Realtime Rooms
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join a specific match room for live tracking (e.g., match_cuid123)
  socket.on('join_match', (matchId: string) => {
    socket.join(`match_${matchId}`);
    console.log(`🎮 Socket ${socket.id} joined live tracking for Match: ${matchId}`);
  });

  // Join a private team chat room (e.g., team_cuid456)
  socket.on('join_team', (teamId: string) => {
    socket.join(`team_${teamId}`);
    console.log(`💬 Socket ${socket.id} joined Chat Room for Team: ${teamId}`);
  });

  // Handle live chat messages
  socket.on('team_message', (data: { teamId: string; username: string; text: string }) => {
    io.to(`team_${data.teamId}`).emit('new_message', {
      username: data.username,
      text: data.text,
      timestamp: new Date().toISOString()
    });
    console.log(`💬 Message in Team [${data.teamId}] by ${data.username}: ${data.text}`);
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Active Simulation Engine for Live Match Trackers
setInterval(() => {
  // Simulate active MLBB matches and broadcast realtime updates to the match rooms
  const activeMatches = ['match_demo1', 'match_demo2'];
  
  activeMatches.forEach(matchId => {
    const liveUpdate = {
      matchId,
      time: Math.floor(Date.now() / 1000),
      team1Kills: Math.floor(Math.random() * 3) + 12,
      team2Kills: Math.floor(Math.random() * 3) + 9,
      goldDiff: Math.floor(Math.random() * 1200) + 200,
      lordCaptured: Math.random() > 0.8 ? 'team1' : 'none',
      event: Math.random() > 0.7 ? '⚡ Savage recorded by player!' : null
    };
    
    io.to(`match_${matchId}`).emit('live_stats', liveUpdate);
  });
}, 5000); // Send update every 5 seconds

const PORT = process.env.BACKEND_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 MLN Esports Core Stateful Backend running on http://localhost:${PORT}`);
});
