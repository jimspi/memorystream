// server.js - Main server file
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

// Database (using in-memory for demo - replace with MongoDB/PostgreSQL)
const db = {
  users: new Map(),
  memories: new Map(),
  sessions: new Map(),
  aiServices: new Map(),
  accessLogs: []
};

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'memorystream.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3001', 'https://memorystream-frontend.vercel.app'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Encryption utilities
class EncryptionManager {
  static generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }

  static encryptData(data, publicKey) {
    const buffer = Buffer.from(JSON.stringify(data), 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  }

  static decryptData(encryptedData, privateKey) {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return JSON.parse(decrypted.toString('utf8'));
  }

  static hashPassword(password) {
    return bcrypt.hashSync(password, 12);
  }

  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }
}

// Memory management utilities
class MemoryManager {
  static generateMemoryId() {
    return crypto.randomUUID();
  }

  static calculateRelevanceScore(memory, context) {
    let score = 0;
    
    // Recency boost
    const daysSince = (Date.now() - new Date(memory.timestamp)) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSince) * 0.1;
    
    // Interaction frequency
    score += (memory.accessCount || 0) * 0.05;
    
    // Context similarity (simplified - would use vector similarity in production)
    if (context.keywords) {
      const memoryText = (memory.content + ' ' + (memory.tags || []).join(' ')).toLowerCase();
      const contextKeywords = context.keywords.map(k => k.toLowerCase());
      const matches = contextKeywords.filter(k => memoryText.includes(k)).length;
      score += (matches / contextKeywords.length) * 5;
    }
    
    return Math.min(score, 10);
  }

  static extractEntities(text) {
    // Simplified entity extraction - would use NLP libraries in production
    const entities = {
      people: [],
      organizations: [],
      locations: [],
      dates: [],
      topics: []
    };
    
    // Basic regex patterns
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      url: /https?:\/\/[^\s]+/g,
      date: /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g
    };
    
    entities.emails = (text.match(patterns.email) || []);
    entities.urls = (text.match(patterns.url) || []);
    entities.dates = (text.match(patterns.date) || []);
    
    return entities;
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Logging middleware
const logAccess = (action, resourceType, resourceId = null) => {
  return (req, res, next) => {
    db.accessLogs.push({
      timestamp: new Date().toISOString(),
      userId: req.user?.id || 'anonymous',
      action,
      resourceType,
      resourceId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  };
};

// User registration and authentication
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;
    
    if (db.users.has(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userId = crypto.randomUUID();
    const { publicKey, privateKey } = EncryptionManager.generateKeyPair();
    
    const user = {
      id: userId,
      email,
      name,
      passwordHash: EncryptionManager.hashPassword(password),
      publicKey,
      privateKey, // In production, this would be encrypted with user's password
      createdAt: new Date().toISOString(),
      preferences: {
        privacyLevel: 'high',
        dataRetention: '1year',
        crossPlatformSync: true
      },
      stats: {
        totalMemories: 0,
        totalInteractions: 0,
        connectedServices: 0
      }
    };
    
    db.users.set(email, user);
    
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });
    
    logger.info('User registered', { userId, email });
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: userId,
        email,
        name,
        publicKey,
        preferences: user.preferences
      }
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = db.users.get(email);
    
    if (!user || !EncryptionManager.verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '24h' });
    
    logger.info('User logged in', { userId: user.id, email });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        publicKey: user.publicKey,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Memory management endpoints
app.post('/api/memories', authenticateToken, logAccess('create', 'memory'), [
  body('content').notEmpty(),
  body('type').isIn(['conversation', 'document', 'note', 'insight']),
  body('source').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, type, source, tags = [], metadata = {} } = req.body;
    const user = [...db.users.values()].find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const memoryId = MemoryManager.generateMemoryId();
    const entities = MemoryManager.extractEntities(content);
    
    // Encrypt the memory content
    const encryptedContent = EncryptionManager.encryptData(content, user.publicKey);
    
    const memory = {
      id: memoryId,
      userId: user.id,
      encryptedContent,
      type,
      source,
      tags,
      entities,
      metadata,
      timestamp: new Date().toISOString(),
      accessCount: 0,
      relevanceScore: 1.0,
      permissions: {
        aiServices: metadata.allowedServices || [],
        shareLevel: 'private'
      }
    };
    
    db.memories.set(memoryId, memory);
    user.stats.totalMemories++;
    
    logger.info('Memory created', { userId: user.id, memoryId, type });
    
    res.status(201).json({
      id: memoryId,
      type,
      source,
      tags,
      entities,
      timestamp: memory.timestamp,
      message: 'Memory stored successfully'
    });
  } catch (error) {
    logger.error('Memory creation error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/memories', authenticateToken, logAccess('list', 'memory'), async (req, res) => {
  try {
    const { limit = 50, offset = 0, type, source, tags } = req.query;
    const userId = req.user.id;
    
    let memories = [...db.memories.values()].filter(m => m.userId === userId);
    
    // Apply filters
    if (type) memories = memories.filter(m => m.type === type);
    if (source) memories = memories.filter(m => m.source === source);
    if (tags) {
      const tagList = tags.split(',');
      memories = memories.filter(m => 
        tagList.some(tag => m.tags.includes(tag))
      );
    }
    
    // Sort by timestamp (most recent first)
    memories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Paginate
    const paginatedMemories = memories.slice(offset, offset + parseInt(limit));
    
    // Return metadata only (content is encrypted)
    const response = paginatedMemories.map(m => ({
      id: m.id,
      type: m.type,
      source: m.source,
      tags: m.tags,
      entities: m.entities,
      timestamp: m.timestamp,
      accessCount: m.accessCount,
      relevanceScore: m.relevanceScore
    }));
    
    res.json({
      memories: response,
      total: memories.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Memory retrieval error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/memories/search', authenticateToken, logAccess('search', 'memory'), [
  body('query').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { query, context = {}, limit = 20 } = req.body;
    const userId = req.user.id;
    const user = [...db.users.values()].find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let memories = [...db.memories.values()].filter(m => m.userId === userId);
    
    // Calculate relevance scores
    const searchContext = {
      keywords: query.toLowerCase().split(' '),
      ...context
    };
    
    memories = memories.map(m => ({
      ...m,
      relevanceScore: MemoryManager.calculateRelevanceScore(m, searchContext)
    }));
    
    // Filter by relevance threshold and sort
    const relevantMemories = memories
      .filter(m => m.relevanceScore > 0.5)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
    
    // For search results, we decrypt content for authorized requests
    const results = relevantMemories.map(m => {
      try {
        const decryptedContent = EncryptionManager.decryptData(m.encryptedContent, user.privateKey);
        
        // Update access count
        m.accessCount = (m.accessCount || 0) + 1;
        
        return {
          id: m.id,
          content: decryptedContent,
          type: m.type,
          source: m.source,
          tags: m.tags,
          entities: m.entities,
          timestamp: m.timestamp,
          relevanceScore: m.relevanceScore
        };
      } catch (err) {
        logger.error('Decryption error', { memoryId: m.id, error: err.message });
        return null;
      }
    }).filter(Boolean);
    
    logger.info('Memory search', { userId, query, resultsCount: results.length });
    
    res.json({
      query,
      results,
      totalFound: results.length
    });
  } catch (error) {
    logger.error('Memory search error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard and analytics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = [...db.users.values()].find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const memories = [...db.memories.values()].filter(m => m.userId === userId);
    const services = [...db.aiServices.values()].filter(s => s.userId === userId);
    
    // Calculate memory stats
    const memoryStats = {
      total: memories.length,
      byType: {},
      bySource: {},
      recentActivity: memories.filter(m => 
        new Date(m.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    };
    
    memories.forEach(m => {
      memoryStats.byType[m.type] = (memoryStats.byType[m.type] || 0) + 1;
      memoryStats.bySource[m.source] = (memoryStats.bySource[m.source] || 0) + 1;
    });
    
    // Service stats
    const serviceStats = {
      total: services.length,
      active: services.filter(s => s.isActive).length,
      totalRequests: services.reduce((sum, s) => sum + s.stats.totalRequests, 0)
    };
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        joinedAt: user.createdAt
      },
      memories: memoryStats,
      services: serviceStats,
      privacy: user.preferences
    });
  } catch (error) {
    logger.error('Dashboard stats error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    dbStats: {
      users: db.users.size,
      memories: db.memories.size,
      aiServices: db.aiServices.size
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MemoryStream API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      memories: {
        create: 'POST /api/memories',
        list: 'GET /api/memories',
        search: 'POST /api/memories/search'
      },
      dashboard: 'GET /api/dashboard/stats'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`MemoryStream API server running on port ${PORT}`);
  console.log(`🧠 MemoryStream API server running on port ${PORT}`);
});

module.exports = app;
