import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { initDatabase, query, run } from './db/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'] }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

import authRoutes from './routes/auth.js';
import programRoutes from './routes/programs.js';
import applicationRoutes from './routes/applications.js';
import beneficiaryRoutes from './routes/beneficiaries.js';

app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);

app.get('/api/categories', async (req, res) => {
  res.json(await query('SELECT * FROM program_categories ORDER BY name'));
});
app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await run('INSERT INTO program_categories (name, description) VALUES (?,?)', [name, description || null]);
    res.json({ id: result.insertId });
  } catch { res.status(400).json({ error: 'Category already exists' }); }
});

app.get('/api/users', async (req, res) => {
  res.json(await query('SELECT id, username, full_name, role, email, contact, barangay, created_at FROM users ORDER BY created_at DESC'));
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    if (!username || !password || !full_name)
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    if (!['admin', 'staff'].includes(role))
      return res.status(400).json({ error: 'Role must be admin or staff' });

    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash(password, 10);
    const result = await run(
      'INSERT INTO users (username, password, full_name, role) VALUES (?,?,?,?)',
      [username, hash, full_name, role]
    );
    res.json({ id: result.insertId, message: 'User created successfully' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (_, res) => res.json({ status: 'OK', time: new Date().toISOString() }));

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n SK System Backend running at http://localhost:${PORT}`);
      console.log(` Database: MySQL (${process.env.DB_NAME || 'sk_system'})`);
      console.log(` Default admin: username=admin password=admin123\n`);
    });
  })
  .catch(err => {
    console.error(' Database connection failed:', err.message);
    console.error(' Check your .env file and make sure MySQL is running!');
    process.exit(1);
  });