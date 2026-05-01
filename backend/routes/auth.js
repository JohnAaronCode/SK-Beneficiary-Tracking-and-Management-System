import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../db/database.js';
import { signToken, authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid username or password' });
    const token = signToken({ id: user.id, username: user.username, role: user.role, full_name: user.full_name });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, email, contact, address, barangay } = req.body;
    if (!username || !password || !full_name)
      return res.status(400).json({ error: 'Username, password, and full name required' });
    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (username, password, full_name, role, email, contact, address, barangay) VALUES (?,?,?,?,?,?,?,?)',
      [username, hash, full_name, 'applicant', email || null, contact || null, address || null, barangay || null]
    );
    const token = signToken({ id: result.insertId, username, role: 'applicant', full_name });
    res.json({ token, user: { id: result.insertId, username, role: 'applicant', full_name } });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await queryOne('SELECT id, username, full_name, role, email, contact, address, barangay FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

export default router;