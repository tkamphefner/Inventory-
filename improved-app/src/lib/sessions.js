// Session management utility functions for the inventory tracker application
import { fetchRows, fetchOne, executeQuery, generateId } from './db';
import { createInventoryTransaction } from './inventory';

/**
 * Create a new session
 * @param {D1Database} db - The D1 database instance
 * @param {Object} sessionData - Session data
 * @param {string} userId - User ID creating the session
 * @returns {Promise<Object>} - Created session
 */
export async function createSession(db, sessionData, userId) {
  const { session_type, location_id, notes } = sessionData;
  
  // Generate ID
  const id = generateId('sess-');
  
  // Insert session
  await executeQuery(
    db,
    `INSERT INTO sessions (
      id, session_type, status, location_id, started_at, created_by, notes
    ) VALUES (?, ?, 'in_progress', ?, CURRENT_TIMESTAMP, ?, ?)`,
    [id, session_type, location_id, userId, notes]
  );
  
  // Return created session
  return getSessionById(db, id);
}

/**
 * Get session by ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - Session ID
 * @returns {Promise<Object>} - Session data
 */
export async function getSessionById(db, id) {
  const query = `
    SELECT s.*, 
           l.name as location_name,
           u.username as created_by_username
    FROM sessions s
    LEFT JOIN locations l ON s.location_id = l.id
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.id = ?
  `;
  
  return fetchOne(db, query, [id]);
}

/**
 * Get recent sessions
 * @param {D1Database} db - The D1 database instance
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of sessions
 */
export async function getSessions(db, filters = {}) {
  const { session_type, status, limit = 10 } = filters;
  
  let query = `
    SELECT s.*, 
           l.name as location_name,
           u.username as created_by_username
    FROM sessions s
    LEFT JOIN locations l ON s.location_id = l.id
    LEFT JOIN users u ON s.created_by = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (session_type) {
    query += ` AND s.session_type = ?`;
    params.push(session_type);
  }
  
  if (status) {
    query += ` AND s.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY s.started_at DESC LIMIT ?`;
  params.push(limit);
  
  return fetchRows(db, query, params);
}

/**
 * Get transactions for a session
 * @param {D1Database} db - The D1 database instance
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>} - Array of transactions
 */
export async function getSessionTransactions(db, sessionId) {
  const query = `
    SELECT t.*, 
           p.name as product_name, 
           sl.name as source_location_name,
           dl.name as destination_location_name,
           u.username as created_by_username
    FROM inventory_transactions t
    JOIN products p ON t.product_id = p.id
    LEFT JOIN locations sl ON t.source_location_id = sl.id
    LEFT JOIN locations dl ON t.destination_location_id = dl.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.session_id = ?
    ORDER BY t.created_at DESC
  `;
  
  return fetchRows(db, query, [sessionId]);
}

/**
 * Add a product to a session
 * @param {D1Database} db - The D1 database instance
 * @param {string} sessionId - Session ID
 * @param {Object} transactionData - Transaction data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Created transaction
 */
export async function addProductToSession(db, sessionId, transactionData, userId) {
  // Get session
  const session = await getSessionById(db, sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.status !== 'in_progress') {
    throw new Error('Cannot add products to a completed or cancelled session');
  }
  
  // Determine transaction type based on session type
  const transaction_type = session.session_type === 'check_in' ? 'check_in' : 'check_out';
  
  // Set source/destination based on session type
  let source_location_id = null;
  let destination_location_id = null;
  
  if (transaction_type === 'check_in') {
    destination_location_id = session.location_id;
  } else if (transaction_type === 'check_out') {
    source_location_id = session.location_id;
  }
  
  // Create transaction
  return createInventoryTransaction(
    db,
    {
      transaction_type,
      product_id: transactionData.product_id,
      source_location_id,
      destination_location_id,
      quantity: transactionData.quantity,
      batch_number: transactionData.batch_number,
      expiration_date: transactionData.expiration_date,
      notes: transactionData.notes
    },
    userId,
    sessionId
  );
}

/**
 * Complete a session
 * @param {D1Database} db - The D1 database instance
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated session
 */
export async function completeSession(db, sessionId, userId) {
  // Get session
  const session = await getSessionById(db, sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.status !== 'in_progress') {
    throw new Error('Session is already completed or cancelled');
  }
  
  // Update session
  await executeQuery(
    db,
    `UPDATE sessions 
     SET status = 'completed', completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [sessionId]
  );
  
  // Return updated session
  return getSessionById(db, sessionId);
}

/**
 * Cancel a session
 * @param {D1Database} db - The D1 database instance
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated session
 */
export async function cancelSession(db, sessionId, userId) {
  // Get session
  const session = await getSessionById(db, sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.status !== 'in_progress') {
    throw new Error('Session is already completed or cancelled');
  }
  
  // Get session transactions
  const transactions = await getSessionTransactions(db, sessionId);
  
  // Reverse all transactions
  for (const transaction of transactions) {
    if (transaction.transaction_type === 'check_in') {
      // For check-in, remove the added inventory
      await executeQuery(
        db,
        `UPDATE inventory 
         SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = ? AND location_id = ?`,
        [transaction.quantity, transaction.product_id, transaction.destination_location_id]
      );
    } else if (transaction.transaction_type === 'check_out') {
      // For check-out, add back the removed inventory
      await executeQuery(
        db,
        `UPDATE inventory 
         SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = ? AND location_id = ?`,
        [transaction.quantity, transaction.product_id, transaction.source_location_id]
      );
    }
  }
  
  // Update session
  await executeQuery(
    db,
    `UPDATE sessions 
     SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [sessionId]
  );
  
  // Return updated session
  return getSessionById(db, sessionId);
}
