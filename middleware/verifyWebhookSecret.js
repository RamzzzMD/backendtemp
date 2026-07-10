export function verifyWebhookSecret(req, res, next) {
  const expected = process.env.WEBHOOK_SECRET;
  const provided = req.get('x-webhook-secret');

  if (!expected) {
    console.error('[security] WEBHOOK_SECRET is not configured on the server.');
    return res.status(500).json({ error: 'Server misconfigured.' });
  }

  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Invalid or missing webhook secret.' });
  }

  next();
}
