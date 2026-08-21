import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import eventRoutesFactory from './routes/events.js';
import aggregatorRoutes from "./routes/aggregator.js";
import chatRoutes from './routes/chat.js';
import path from 'path';
import { fileURLToPath } from 'url';
import recommendRoutes from "./routes/recommendations.js";
import preferencesRoutes from "./routes/preferences.js";
import internshipRoutes from "./routes/internshipRoutes.js";
import notificationRoutes from "./routes/notifications.js";
import { apiLimiter } from './middleware/rateLimiter.js';
import { 
  errorHandler, 
  notFoundHandler, 
  handleUncaughtException, 
  handleUnhandledRejection 
} from './middleware/errorHandler.js';
import helmet from 'helmet';
import compression from 'compression';

// Load env FIRST — before anything else reads process.env
dotenv.config();

// Validate required secrets at startup — fail fast rather than silently using weak fallbacks
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGO_URI'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Handle uncaught exceptions AFTER dotenv so NODE_ENV is available
handleUncaughtException();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust the reverse proxy (Render/Heroku/etc) so rate-limiter works properly
// Set to 1 for Render's single reverse proxy
app.set('trust proxy', 1);

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'];
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow Cloudinary images etc.
  contentSecurityPolicy: false,     // Disable CSP for SPA compatibility
}));

// Scoped CORS — dynamic for Vercel
app.use(cors(corsOptions));

// Gzip responses
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname,'uploads')));

// Health check endpoint (no rate limit) — includes env info
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutesFactory(io));
app.use('/api/chat', chatRoutes);
app.use("/api/aggregator", aggregatorRoutes);
app.use("/api/recommendations", recommendRoutes); // Fixed route name
app.use("/api/preferences", preferencesRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/notifications", notificationRoutes);

// MongoDB
connectDB();

// Socket logic: rooms for event chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('joinEvent', (eventId) => { socket.join(String(eventId)); });
  socket.on('leaveEvent', (eventId) => { socket.leave(String(eventId)); });
  // Join personal room for targeted notifications
  socket.on('joinUserRoom', (userId) => { socket.join(`user:${userId}`); });
  socket.on('sendMessage', (msg) => { // msg: { eventId, user, text }
    io.to(String(msg.eventId)).emit('message', msg);
  });
  socket.on('deleteMessage', ({ eventId, msgId }) => {
    io.to(String(eventId)).emit('messageDeleted', msgId);
  });
  socket.on('disconnect', ()=> console.log('User disconnected:', socket.id));
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const serverInstance = server.listen(PORT, ()=> {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
handleUnhandledRejection();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  serverInstance.close(() => {
    console.log('💥 Process terminated!');
  });
});
