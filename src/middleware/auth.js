import { findProfileByApiKey } from '../db/profiles.js';

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ status: 'error', message: 'Missing or malformed Authorization header. Expected: Bearer <apiKey>.' });
  }

  const profile = findProfileByApiKey(token);
  if (!profile) {
    return res.status(401).json({ status: 'error', message: 'Invalid API key.' });
  }

  req.profile = profile;
  next();
}
