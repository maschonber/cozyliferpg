import { Request, Response, NextFunction } from 'express';
import { JWTService } from './jwt.service';

/**
 * Extend Express Request to include user information
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

/**
 * Middleware to authenticate JWT tokens
 * Protects routes by requiring a valid Bearer token
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.warn(`⚠️ Authentication failed: No token provided for ${req.method} ${req.path}`);
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const payload = JWTService.verifyToken(token);

  if (!payload) {
    console.warn(`⚠️ Authentication failed: Invalid token for ${req.method} ${req.path}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  req.user = payload;
  console.log(`✅ Authenticated request: ${req.method} ${req.path} (user: ${payload.username})`);
  next();
}
