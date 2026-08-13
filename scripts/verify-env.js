#!/usr/bin/env node
// Verify environment variables are set correctly
// Usage: node scripts/verify-env.js

const requiredVars = [
  'DATABASE_URL',
  'TARGET_API_URL',
  'TARGET_API_KEY',
  'ALLOWED_ORIGIN',
];

const optionalVars = [
  'JWT_SECRET',
  'REVENUECAT_WEBHOOK_SECRET',
  'CRON_SECRET',
  'IP_RATE_LIMIT_PER_MINUTE',
  'MAX_CONCURRENT_JOBS',
  'TELEGRAM_BOT_TOKEN',
];

console.log('\n🔍 Verifying Environment Variables\n');

let hasErrors = false;
const missing = [];
const present = [];

// Check required variables
console.log('Required Variables:');
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}`);
    present.push(varName);
  } else {
    console.log(`  ❌ ${varName} - MISSING`);
    missing.push(varName);
    hasErrors = true;
  }
});

// Check optional variables
console.log('\nOptional Variables:');
optionalVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}`);
    present.push(varName);
  } else {
    console.log(`  ⚠️  ${varName} - Not set (using default or disabled)`);
  }
});

// Summary
console.log('\n' + '─'.repeat(60));
console.log(`\nSummary:`);
console.log(`  ✅ Present: ${present.length}`);
console.log(`  ❌ Missing: ${missing.length}`);

if (hasErrors) {
  console.log('\n❌ Missing required variables:');
  missing.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 See ENV_SETUP.md for setup instructions.\n');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!\n');
  process.exit(0);
}
