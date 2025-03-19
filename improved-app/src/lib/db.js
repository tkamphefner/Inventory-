// Database utility functions for the inventory tracker application
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper function to execute database queries
 * @param {D1Database} db - The D1 database instance
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
export async function executeQuery(db, query, params = []) {
  try {
    const result = await db.prepare(query).bind(...params).run();
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Helper function to fetch multiple rows
 * @param {D1Database} db - The D1 database instance
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Array of rows
 */
export async function fetchRows(db, query, params = []) {
  try {
    const result = await db.prepare(query).bind(...params).all();
    return result.results;
  } catch (error) {
    console.error('Database fetch error:', error);
    throw error;
  }
}

/**
 * Helper function to fetch a single row
 * @param {D1Database} db - The D1 database instance
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Single row or null
 */
export async function fetchOne(db, query, params = []) {
  try {
    const result = await db.prepare(query).bind(...params).first();
    return result;
  } catch (error) {
    console.error('Database fetch error:', error);
    throw error;
  }
}

/**
 * Generate a unique ID for database records
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export function generateId(prefix = '') {
  return `${prefix}${uuidv4()}`;
}

/**
 * Create an audit log entry
 * @param {D1Database} db - The D1 database instance
 * @param {string} userId - User ID
 * @param {string} action - Action performed
 * @param {string} entityType - Type of entity affected
 * @param {string} entityId - ID of entity affected
 * @param {Object} details - Additional details
 * @param {string} ipAddress - IP address of user
 * @returns {Promise} - Query result
 */
export async function createAuditLog(
  db,
  userId,
  action,
  entityType,
  entityId,
  details = {},
  ipAddress = ''
) {
  const id = generateId('log-');
  const query = `
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    id,
    userId,
    action,
    entityType,
    entityId,
    JSON.stringify(details),
    ipAddress,
  ];
  
  return executeQuery(db, query, params);
}
