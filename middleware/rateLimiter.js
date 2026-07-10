import rateLimit from 'express-rate-limit';

export const inboundLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120, // generous — this endpoint is only ever called by your own Cloudflare Worker
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
