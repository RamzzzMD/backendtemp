import { Router } from 'express';
import mongoose from 'mongoose';
import { Email } from '../models/Email.js';
import { generateUsername, isValidUsername } from '../utils/generateAddress.js';

export const mailRouter = Router();

function getAllowedDomains() {
  return (process.env.DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

// GET /api/domains
mailRouter.get('/domains', (req, res) => {
  res.json({ domains: getAllowedDomains() });
});

// POST /api/address  { username?, domain? }
mailRouter.post('/address', (req, res) => {
  const domains = getAllowedDomains();
  const { username, domain } = req.body || {};

  const chosenDomain = (domain || domains[0] || '').toLowerCase();
  if (!domains.includes(chosenDomain)) {
    return res.status(400).json({ error: 'Domain is not configured on this server.' });
  }

  let localPart = username ? String(username).trim().toLowerCase() : '';
  if (localPart) {
    if (!isValidUsername(localPart)) {
      return res.status(400).json({
        error: 'Username must be 3-64 characters: letters, numbers, dots, dashes or underscores.',
      });
    }
  } else {
    localPart = generateUsername();
  }

  res.json({ address: `${localPart}@${chosenDomain}` });
});

// GET /api/mail/:address?search=&page=&limit=
mailRouter.get('/mail/:address', async (req, res, next) => {
  try {
    const address = req.params.address.toLowerCase();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const search = (req.query.search || '').trim();

    const filter = { to: address };
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { from: { $regex: search, $options: 'i' } },
        { fromName: { $regex: search, $options: 'i' } },
        { text: { $regex: search, $options: 'i' } },
      ];
    }

    const [emails, total] = await Promise.all([
      Email.find(filter, { html: 0 }) // list view doesn't need the full HTML payload
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Email.countDocuments(filter),
    ]);

    res.json({ emails, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/mail/:address/:id
mailRouter.get('/mail/:address/:id', async (req, res, next) => {
  try {
    const { address, id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const email = await Email.findOneAndUpdate(
      { _id: id, to: address.toLowerCase() },
      { $set: { read: true } },
      { new: true }
    ).lean();

    if (!email) return res.status(404).json({ error: 'Email not found.' });
    res.json({ email });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/mail/:address/:id
mailRouter.delete('/mail/:address/:id', async (req, res, next) => {
  try {
    const { address, id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const result = await Email.deleteOne({ _id: id, to: address.toLowerCase() });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Email not found.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/mail/:address  (clear inbox)
mailRouter.delete('/mail/:address', async (req, res, next) => {
  try {
    const address = req.params.address.toLowerCase();
    const result = await Email.deleteMany({ to: address });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
});
