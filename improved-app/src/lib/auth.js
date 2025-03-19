// Authentication utility functions for the inventory tracker application
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fetchOne, executeQuery, generateId } from './db';

// Secret key for JWT signing - in production, this should be an environment variable
const JWT_SECRET = 'inventory-tracker-secret-key';
const JWT_EXPIRY = '24h';

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - Whether the password matches
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Authenticate a user with username and password
 * @param {D1Database} db - The D1 database instance
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} - Authentication result with token and user data
 */
export async function authenticateUser(db, username, password) {
  // Find user by username
  const user = await fetchOne(
    db,
    'SELECT * FROM users WHERE username = ? AND active = 1',
    [username]
  );
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid password');
  }
  
  // Update last login timestamp
  await executeQuery(
    db,
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
    [user.id]
  );
  
  // Generate token
  const token = generateToken(user);
  
  // Return user data (excluding password) and token
  const { password_hash, ...userData } = user;
  return {
    user: userData,
    token,
  };
}

/**
 * Create a new user
 * @param {D1Database} db - The D1 database instance
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - Created user
 */
export async function createUser(db, userData) {
  const { username, password, email, full_name, role = 'staff' } = userData;
  
  // Check if username already exists
  const existingUser = await fetchOne(
    db,
    'SELECT id FROM users WHERE username = ?',
    [username]
  );
  
  if (existingUser) {
    throw new Error('Username already exists');
  }
  
  // Hash password
  const password_hash = await hashPassword(password);
  
  // Generate ID
  const id = generateId('user-');
  
  // Insert user
  await executeQuery(
    db,
    `INSERT INTO users (id, username, password_hash, email, full_name, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, username, password_hash, email, full_name, role]
  );
  
  // Return created user (excluding password)
  return {
    id,
    username,
    email,
    full_name,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active: true,
  };
}

/**
 * Get user by ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - User ID
 * @returns {Promise<Object>} - User data
 */
export async function getUserById(db, id) {
  const user = await fetchOne(
    db,
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  
  if (!user) {
    return null;
  }
  
  // Exclude password hash
  const { password_hash, ...userData } = user;
  return userData;
}

/**
 * Check if a user has a specific role
 * @param {Object} user - User object
 * @param {string|Array} roles - Role or array of roles to check
 * @returns {boolean} - Whether the user has the role
 */
export function hasRole(user, roles) {
  if (!user || !user.role) return false;
  
  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }
  
  return user.role === roles;
}
