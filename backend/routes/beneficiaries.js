import { Router } from 'express';
import { query, queryOne, run } from '../db/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { program_id, search } = req.query;
    let sql = `SELECT b.*, p.title as program_title, p.category FROM beneficiaries b
      LEFT JOIN programs p ON b.program_id = p.id WHERE 1=1`;
    const params = [];
    if (program_id) { sql += ' AND b.program_id = ?'; params.push(program_id); }
    if (search) { sql += ' AND (b.full_name LIKE ? OR b.address LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY b.received_at DESC';
    res.json(await query(sql, params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/search', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Search name required' });
    const results = await query(`
      SELECT b.full_name, b.address, b.contact, b.received_at,
        p.title as program_title, p.category, p.start_date, p.end_date,
        a.age, a.barangay, a.status as application_status
      FROM beneficiaries b
      LEFT JOIN programs p ON b.program_id = p.id
      LEFT JOIN applications a ON b.application_id = a.id
      WHERE b.full_name LIKE ?
      ORDER BY b.received_at DESC
    `, [`%${name}%`]);
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/reports/summary', authenticate, requireAdmin, async (req, res) => {
  try {
    const [totalPrograms, activePrograms, pendingApps, approvedBeneficiaries, rejectedApps] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM programs'),
      queryOne("SELECT COUNT(*) as count FROM programs WHERE status = 'open'"),
      queryOne("SELECT COUNT(*) as count FROM applications WHERE status = 'pending'"),
      queryOne("SELECT COUNT(*) as count FROM beneficiaries"),
      queryOne("SELECT COUNT(*) as count FROM applications WHERE status = 'rejected'"),
    ]);

    const perProgram = await query(`SELECT p.title, p.category, p.slots, p.slots_used,
      COUNT(b.id) as beneficiary_count FROM programs p
      LEFT JOIN beneficiaries b ON p.id = b.program_id GROUP BY p.id ORDER BY beneficiary_count DESC`);

    const mostAssisted = await query(`SELECT full_name, address, COUNT(*) as program_count
      FROM beneficiaries GROUP BY full_name, address ORDER BY program_count DESC LIMIT 20`);

    const repeatBeneficiaries = await query(`SELECT full_name, address, COUNT(*) as times_assisted
      FROM beneficiaries GROUP BY full_name, address HAVING COUNT(*) > 1 ORDER BY times_assisted DESC`);

    res.json({
      summary: {
        totalPrograms: totalPrograms.count,
        activePrograms: activePrograms.count,
        pendingApps: pendingApps.count,
        approvedBeneficiaries: approvedBeneficiaries.count,
        rejectedApps: rejectedApps.count
      },
      perProgram,
      mostAssisted,
      repeatBeneficiaries
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;