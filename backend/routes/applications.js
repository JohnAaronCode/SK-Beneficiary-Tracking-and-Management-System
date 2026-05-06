import { Router } from 'express';
import { query, queryOne, run } from '../db/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/program/:programId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `SELECT a.*, u.username FROM applications a
      LEFT JOIN users u ON a.applicant_id = u.id WHERE a.program_id = ?`;
    const params = [req.params.programId];
    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    if (search) { sql += ' AND (a.full_name LIKE ? OR a.address LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY a.created_at DESC';
    res.json(await query(sql, params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const apps = await query(`SELECT a.*, p.title as program_title, p.category as program_category
      FROM applications a LEFT JOIN programs p ON a.program_id = p.id
      WHERE a.applicant_id = ? ORDER BY a.created_at DESC`, [req.user.id]);
    res.json(apps);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT a.*, p.title as program_title FROM applications a
      LEFT JOIN programs p ON a.program_id = p.id WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    sql += ' ORDER BY a.created_at DESC LIMIT 100';
    res.json(await query(sql, params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { program_id, full_name, address, age, contact, barangay, requirements_submitted } = req.body;
    if (!program_id || !full_name || !address || !age || !contact)
      return res.status(400).json({ error: 'All required fields must be filled' });

    const program = await queryOne('SELECT * FROM programs WHERE id = ?', [program_id]);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    if (program.status !== 'open') return res.status(400).json({ error: 'Program is not open for registration' });
    if (program.slots_used >= program.slots) return res.status(400).json({ error: 'No more slots available' });

    if (req.user.role === 'applicant') {
      const existing = await queryOne('SELECT id FROM applications WHERE program_id=? AND applicant_id=?', [program_id, req.user.id]);
      if (existing) return res.status(400).json({ error: 'You already applied to this program' });
    }

    const result = await run(
      'INSERT INTO applications (program_id, applicant_id, full_name, address, age, contact, barangay, requirements_submitted) VALUES (?,?,?,?,?,?,?,?)',
      [program_id, req.user.id, full_name, address, age, contact, barangay || null, requirements_submitted || null]
    );
    res.json({ id: result.insertId, message: 'Application submitted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['approved','rejected','waitlist'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const app = await queryOne('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    await run(
      'UPDATE applications SET status=?, notes=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?',
      [status, notes || null, req.user.id, req.params.id]
    );

    if (status === 'approved') {
      const existing = await queryOne('SELECT id FROM beneficiaries WHERE application_id = ?', [req.params.id]);
      if (!existing) {
        await run(
          'INSERT INTO beneficiaries (application_id, program_id, full_name, address, contact) VALUES (?,?,?,?,?)',
          [req.params.id, app.program_id, app.full_name, app.address, app.contact]
        );
        await run('UPDATE programs SET slots_used = slots_used + 1 WHERE id = ?', [app.program_id]);
      }
    }

    res.json({ message: `Application ${status}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;