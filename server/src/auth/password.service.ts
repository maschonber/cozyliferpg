import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Password service for secure password hashing and verification
 */
export class PasswordService {
  /**
   * Hash a plain text password
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a hashed password
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
