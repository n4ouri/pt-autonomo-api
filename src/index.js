/**
 * Portuguese Autónomo & Tax Optimization Engine & SDK
 * 
 * Exported functions for direct library consumption in Node.js applications.
 */

export * from './constants/legal-constants.js';
export * from './constants/tax-calendar.js';
export * from './engines/simplificado.js';
export * from './engines/seg-social.js';
export * from './engines/company-compare.js';
export * from './engines/efatura-optimizer.js';
export * from './engines/vies-compliance.js';
export * from './engines/audit-engine.js';
export { app } from './app.js';
