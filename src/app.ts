import express, { Request, Response, NextFunction } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import clientRouter from './routes/clientRoutes.js';
import adminRouter from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, '../views'));

// Static files
app.use(express.static(join(__dirname, '../public')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', clientRouter);
app.use('/admin', adminRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).send('404 - Page Not Found');
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('500 - Internal Server Error');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export default app;
