import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'Test123!';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n=================================');
  console.log('Password Hash Generator');
  console.log('=================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('=================================\n');
  console.log('Copy this hash to 001_seed_test_users.sql');
  console.log('Replace all PASTE_HASH_HERE with this value\n');
}

generateHash();
