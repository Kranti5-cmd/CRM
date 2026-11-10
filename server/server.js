const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/team', require('./routes/team'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/bootcamp', require('./routes/bootcamp'));
app.use('/api/email-automation', require('./routes/emailAutomation'));
app.use('/api/search', require('./routes/search'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CRM API is running' });
});

// Error handler
app.use(errorHandler);

const { initDailyReportScheduler } = require('./services/reportScheduler');
const { initSupabasePoller } = require('./services/supabaseSyncService');
const { initAutomationPoller } = require('./services/automationEngine');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initDailyReportScheduler();
  initSupabasePoller();
  initAutomationPoller();
});

module.exports = app;

