import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { registerUser, loginUser, getCurrentUser } from './server/controllers/authController.js';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getCategories,
  createCategory,
  getMonthlyReport,
  getTrendsReport,
  getBudgets,
  setBudget,
} from './server/controllers/expenseController.js';
import { authMiddleware } from './server/middleware/auth.js';
import { SPRING_BOOT_DOCS } from './server/springbootDocs.js';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // API Authentication Routes
  app.post('/api/auth/register', registerUser);
  app.post('/api/auth/login', loginUser);
  app.get('/api/auth/me', authMiddleware as any, getCurrentUser as any);

  // API Expenses & Categories
  app.get('/api/expenses', authMiddleware as any, getExpenses as any);
  app.post('/api/expenses', authMiddleware as any, createExpense as any);
  app.put('/api/expenses/:id', authMiddleware as any, updateExpense as any);
  app.delete('/api/expenses/:id', authMiddleware as any, deleteExpense as any);

  app.get('/api/categories', authMiddleware as any, getCategories as any);
  app.post('/api/categories', authMiddleware as any, createCategory as any);

  // API Reports & Analytics
  app.get('/api/reports/monthly', authMiddleware as any, getMonthlyReport as any);
  app.get('/api/reports/trends', authMiddleware as any, getTrendsReport as any);

  // API Budgets
  app.get('/api/budgets', authMiddleware as any, getBudgets as any);
  app.post('/api/budgets', authMiddleware as any, setBudget as any);

  // Spring Boot & MySQL Reference Code Explorer
  app.get('/api/system/springboot-docs', (_req, res) => {
    res.json({
      success: true,
      files: SPRING_BOOT_DOCS,
    });
  });

  app.get('/api/system/schema-sql', (_req, res) => {
    try {
      const sqlPath = path.resolve(process.cwd(), 'server/db/schema.sql');
      const content = fs.readFileSync(sqlPath, 'utf-8');
      res.json({ success: true, schemaSql: content });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Could not load schema.sql' });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite Dev or Production Static Serve
  if (!isProd && !fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
