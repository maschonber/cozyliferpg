import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { PasswordService } from './password.service';

const router = Router();

interface UpdatePasswordRequest {
  username: string;
  newPassword: string;
  adminSecret?: string;
}

/**
 * TEMPORARY ADMIN ENDPOINT - Remove in production!
 * Allows password updates via HTTP request without CLI access
 */
router.post('/update-password', async (req: Request<{}, {}, UpdatePasswordRequest>, res: Response) => {
  try {
    const { username, newPassword, adminSecret } = req.body;

    // Basic validation
    if (!username || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Username and newPassword are required'
      });
    }

    // Optional: Add a simple admin secret check
    // Uncomment if you want extra protection
    // const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-me-in-production';
    // if (adminSecret !== ADMIN_SECRET) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Invalid admin secret'
    //   });
    // }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `User '${username}' not found`
      });
    }

    // Hash the new password
    const passwordHash = await PasswordService.hash(newPassword);

    // Update the password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2',
      [passwordHash, username]
    );

    console.log(`✅ Password updated for user: ${username}`);

    res.json({
      success: true,
      message: `Password successfully updated for user '${username}'`,
      warning: '⚠️  Remember to remove this admin endpoint before going to production!'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update password'
    });
  }
});

/**
 * Simple hash generator endpoint
 * Just generates a hash without updating the database
 */
router.post('/hash-password', async (req: Request<{}, {}, { password: string }>, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const hash = await PasswordService.hash(password);

    res.json({
      success: true,
      password: password,
      hash: hash,
      sqlCommand: `UPDATE users SET password_hash = '${hash}' WHERE username = 'qurbl';`
    });

  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to hash password'
    });
  }
});

export default router;
