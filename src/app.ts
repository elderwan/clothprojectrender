import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import clientRouter from './routes/clientRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import apiRouter from './routes/apiRoutes.js';
import { injectUser } from './middleware/authMiddleware.js';
import './types/session.js'; // session type augmentation

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', join(projectRoot, 'views'));

// Static files
app.use(express.static(join(projectRoot, 'public')));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'maison-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
}));

// Inject user into all templates
app.use(injectUser);

// Routes
app.use('/', apiRouter);
app.use('/', clientRouter);
app.use('/', adminRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).render('404', { title: '404' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('500 - Internal Server Error');
});

export default app;
