import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { signToken, AuthenticatedRequest } from '../middleware/auth.js';

export function registerUser(req: Request, res: Response) {
  try {
    const { username, email, mail, password } = req.body;
    const userEmail = (email || mail || '').trim();
    const userClean = (username || '').trim();

    if (!userClean || userClean.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userEmail || !emailRegex.test(userEmail)) {
      res.status(400).json({
        success: false,
        message: 'A valid email address (mail) is required.',
      });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    // Check existing
    if (db.findUserByEmail(userEmail)) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    if (db.findUserByUsername(userClean)) {
      res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another.',
      });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = db.createUser(userClean, userEmail, passwordHash);
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
    });
  }
}

export function loginUser(req: Request, res: Response) {
  try {
    const { username, email, mail, identifier, password } = req.body;
    const lookup = (identifier || email || mail || username || '').trim();

    if (!lookup) {
      res.status(400).json({
        success: false,
        message: 'Username or email address is required.',
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
      return;
    }

    // Find user by email or username
    let user = db.findUserByEmail(lookup);
    if (!user) {
      user = db.findUserByUsername(lookup);
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
      return;
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
    });
  }
}

export function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated.' });
    return;
  }
  res.status(200).json({
    success: true,
    user: req.user,
  });
}
