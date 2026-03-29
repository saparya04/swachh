const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app    = express();
const PORT   = process.env.PORT || 5000;

// ── Models ────────────────────────────────────────────────────────────────────
const Message = require('./models/Message');
const User    = require('./models/User');

// ── Routes ────────────────────────────────────────────────────────────────────
const userRoutes  = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── DB ────────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => { console.error('MongoDB error:', err); process.exit(1); });

// ── API ───────────────────────────────────────────────────────────────────────
app.use('/api/users',  userRoutes);
app.use('/api/events', eventRoutes);

// ── Chat history (kept as direct route for backwards compatibility) ────────────
app.get('/api/messages/:conversationId', async (req, res) => {
  try {
    const msgs = await Message.find({ conversationId: req.params.conversationId })
      .sort({ timestamp: 1 });
    res.json(msgs);
  } catch { res.status(500).json({ error: 'Failed to fetch chat history.' }); }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('SwachhMitra Backend is running! 🌱'));

// ── Socket.io ─────────────────────────────────────────────────────────────────
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  socket.on('joinRoom', ({ conversationId }) => {
    socket.join(conversationId);
  });

  socket.on('sendMessage', async data => {
    const { conversationId, senderId, senderName, text } = data;
    const msg = new Message({ conversationId, senderId, senderName, text });
    await msg.save();
    io.to(conversationId).emit('newMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
});