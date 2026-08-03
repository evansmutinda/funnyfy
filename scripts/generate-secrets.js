#!/usr/bin/env node
// Generate secure random secrets for environment variables
// Usage: node scripts/generate-secrets.js

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('\n🔐 Generated Secrets for Environment Variables\n');
console.log('Copy these to your .env.local or Vercel environment variables:\n');
console.log('─'.repeat(60));

console.log('\n# JWT Secret (for authentication)');
console.log(`JWT_SECRET=${generateSecret(32)}`);

console.log('\n# Cron Secret (for protecting cron endpoints)');
console.log(`CRON_SECRET=${generateSecret(32)}`);

console.log('\n# RevenueCat Webhook Secret (get from RevenueCat dashboard)');
console.log('# REVENUECAT_WEBHOOK_SECRET=... (get from RevenueCat)');

console.log('\n─'.repeat(60));
console.log('\n✅ Secrets generated!');
console.log('⚠️  Keep these secure and never commit them to git.\n');
