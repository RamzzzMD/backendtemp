import { Router } from 'express';
import { Email } from '../models/Email.js';
import { verifyWebhookSecret } from '../middleware/verifyWebhookSecret.js';
import { sanitizeEmailHtml } from '../utils/sanitizeHtml.js';
import { emitNewMail } from '../sockets/index.js';

export const inboundRouter = Router();

// POST /api/inbound  — called by the Cloudflare Email Worker, not by the frontend.
inboundRouter.post('/inbound', verifyWebhookSecret, async (req, res, next) => {
  try {
    const { to, from, fromName, subject, text, html, attachments } = req.body || {};

    if (!to || !from) {
      return res.status(400).json({ error: 'Missing "to" or "from".' });
    }

    const domains = (process.env.DOMAINS || '')
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    const toAddress = String(to).toLowerCase();
    const toDomain = toAddress.split('@')[1];

    if (!domains.includes(toDomain)) {
      // Not one of our configured domains — accept the webhook call but don't store it.
      return res.status(202).json({ accepted: false, reason: 'Domain not configured on this server.' });
    }

    const email = await Email.create({
      to: toAddress,
      from: String(from).toLowerCase(),
      fromName: fromName || '',
      subject: subject || '(no subject)',
      text: text || '',
      html: sanitizeEmailHtml(html || ''),
      attachments: Array.isArray(attachments) ? attachments.slice(0, 20) : [],
    });

    const io = req.app.get('io');
    if (io) emitNewMail(io, toAddress, email.toObject());

    res.status(201).json({ accepted: true, id: email._id });
  } catch (err) {
    next(err);
  }
});
