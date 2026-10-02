const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adivasisetu';

// Create uploads directory if missing
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static files
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/scholarships', require('./routes/scholarships'));
app.use('/api/eligibility', require('./routes/eligibility'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'AdivasiSetu',
    version: '1.0.0',
    tagline: 'One Platform • Five Schemes • One Scholarship Journey',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting/Disconnected'
  });
});

// Auto-seed function to ensure demo data exists on launch
async function checkAndAutoSeed() {
  try {
    const Scholarship = require('./models/Scholarship');
    const count = await Scholarship.countDocuments();
    if (count === 0) {
      console.log('No scholarships found in database. Running initial database seeder...');
      // Execute the seeder module
      const seedScript = require('./data/seed');
    } else {
      console.log(`Database already initialized with ${count} scholarships.`);
    }
  } catch (err) {
    console.warn('Auto-seed check note:', err.message);
  }
}

// Connect to MongoDB & Start Server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('====================================================');
    console.log('  ADIVASISETU - SCHOLARSHIP PORTAL BACKEND ONLINE   ');
    console.log('  Connected to MongoDB:', MONGODB_URI);
    console.log('====================================================');

    await checkAndAutoSeed();

    app.listen(PORT, () => {
      console.log(`\nServer running at: http://localhost:${PORT}`);
      console.log(`Serving frontend at: http://localhost:${PORT}/index.html`);
      console.log(`Admin Portal at:    http://localhost:${PORT}/admin.html`);
      console.log(`API Base URL:       http://localhost:${PORT}/api\n`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err.message);
    console.log('Starting server in fallback mode...');
    app.listen(PORT, () => {
      console.log(`Server running with warnings at: http://localhost:${PORT}`);
    });
  });

module.exports = app;
