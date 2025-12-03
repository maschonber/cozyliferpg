# Server Scripts

Utility scripts for managing the CozyLife RPG backend.

## Password Hash Generator

Generates a bcrypt hash for a password, useful for updating user passwords in the database.

### Usage

```bash
cd server
npm run hash-password <your-new-password>
```

### Example

```bash
npm run hash-password MySecurePassword123!
```

This will output:
- The hashed password
- A ready-to-run SQL UPDATE statement

### Updating Password in Railway

1. Generate the hash using the script above
2. Copy the SQL UPDATE command from the output
3. Run it in Railway:
   - Option A: Use Railway CLI: `railway run psql -c "UPDATE users SET password_hash = '...' WHERE username = 'qurbl';"`
   - Option B: Use Railway's database interface directly

### Security Note

Never commit passwords to git. This script is for local development and manual password management only.
