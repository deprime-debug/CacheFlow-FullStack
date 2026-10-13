import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserRow } from '../db/database.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'spendflow-secure-jwt-key-38475927492';

export interface AuthenticatedRequest extends Request {
  user?: Omit<UserRow, 'passwordHash'>;
}

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Authorization Bearer token is missing.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = db.findUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid session: User no longer exists.',
      });
      return;
    }

    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
}
