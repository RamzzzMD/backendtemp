import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    filename: String,
    contentType: String,
    size: Number,
  },
  { _id: false }
);

const emailSchema = new mongoose.Schema({
  to: { type: String, required: true, lowercase: true, trim: true, index: true },
  from: { type: String, required: true, trim: true },
  fromName: { type: String, default: '' },
  subject: { type: String, default: '(no subject)' },
  text: { type: String, default: '' },
  html: { type: String, default: '' },
  attachments: { type: [attachmentSchema], default: [] },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for the common query: list an inbox, newest first.
emailSchema.index({ to: 1, createdAt: -1 });

export const Email = mongoose.model('Email', emailSchema);

/**
 * Creates (or updates) the TTL index that makes this a *temporary* mail store:
 * MongoDB itself deletes documents once `createdAt` is older than MAIL_TTL_SECONDS.
 * If the env value changes between deploys, the existing index is modified in place
 * via collMod instead of failing with an "index already exists with different options" error.
 */
export async function ensureTTLIndex() {
  const ttl = parseInt(process.env.MAIL_TTL_SECONDS || '86400', 10);
  const collection = Email.collection;

  const indexes = await collection.indexes().catch(() => []);
  const existing = indexes.find((idx) => idx.name === 'createdAt_ttl');

  if (!existing) {
    await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: ttl, name: 'createdAt_ttl' });
    console.log(`[db] Created TTL index: emails expire after ${ttl}s`);
  } else if (existing.expireAfterSeconds !== ttl) {
    await collection.command({
      collMod: collection.collectionName,
      index: { keyPattern: { createdAt: 1 }, expireAfterSeconds: ttl },
    });
    console.log(`[db] Updated TTL index: emails now expire after ${ttl}s`);
  }
}
