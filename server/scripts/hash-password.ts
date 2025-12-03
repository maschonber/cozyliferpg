import { PasswordService } from '../src/auth/password.service';

/**
 * Simple script to hash a password for manual database updates
 * Usage: npm run hash-password
 */
async function hashPassword() {
  const password = process.argv[2];

  if (!password) {
    console.error('\n❌ Error: No password provided');
    console.log('\nUsage: npm run hash-password <your-password>');
    console.log('Example: npm run hash-password MyNewPassword123!\n');
    process.exit(1);
  }

  console.log('\n🔐 Hashing password...\n');

  const hash = await PasswordService.hash(password);

  console.log('✅ Password hashed successfully!\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n📋 To update the database, run this SQL command:\n');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'qurbl';\n`);
  console.log('You can run this via Railway CLI or directly in your PostgreSQL client.\n');
}

hashPassword().catch((error) => {
  console.error('Error hashing password:', error);
  process.exit(1);
});
