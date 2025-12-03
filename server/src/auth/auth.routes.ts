import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { PasswordService } from './password.service';
import { JWTService } from './jwt.service';
import { LoginRequest, AuthResponse } from '../../../shared/types';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response<AuthResponse>) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
  }

  try {
    // Find user in database
    const result = await pool.query(
      'SELECT id, username, password_hash, created_at FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await PasswordService.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = JWTService.generateToken({
      userId: user.id,
      username: user.username
    });

    // Return success response
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify if a token is still valid (protected route example)
 */
router.post('/verify', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  const payload = JWTService.verifyToken(token);

  if (!payload) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  res.json({
    success: true,
    user: {
      id: payload.userId,
      username: payload.username,
      createdAt: new Date().toISOString() // Placeholder
    }
  });
});

export default router;
