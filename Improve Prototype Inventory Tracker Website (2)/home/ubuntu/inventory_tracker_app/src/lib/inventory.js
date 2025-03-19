// Inventory management utility functions for the inventory tracker application
import { fetchRows, fetchOne, executeQuery, generateId } from './db';

/**
 * Get inventory levels with optional filtering
 * @param {D1Database} db - The D1 database instance
 * @param {Object} filters - Optional filters (location, product category, etc.)
 * @returns {Promise<Array>} - Array of inventory entries with product details
 */
export async function getInventory(db, filters = {}) {
  const { locationId, categoryId, search, lowStock, limit = 100, offset = 0 } = filters;
  
  let query = `
    SELECT i.*, 
           p.name as product_name, p.barcode, p.unit_price, p.unit_cost, p.case_size, 
           p.minimum_stock, p.varietal, p.category_id,
           c.name as category_name,
           l.name as location_name, l.type as location_type
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN locations l ON i.location_id = l.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  
  const params = [];
  
  if (locationId) {
    query += ` AND i.location_id = ?`;
    params.push(locationId);
  }
  
  if (categoryId) {
    query += ` AND (p.category_id = ? OR c.parent_id = ?)`;
    params.push(categoryId, categoryId);
  }
  
  if (search) {
    query += ` AND (p.name LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (lowStock) {
    query += ` AND i.quantity <= p.minimum_stock`;
  }
  
  query += ` ORDER BY p.name LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  return fetchRows(db, query, params);
}

/**
 * Get inventory summary statistics
 * @param {D1Database} db - The D1 database instance
 * @returns {Promise<Object>} - Summary statistics
 */
export async function getInventorySummary(db) {
  // Get total bottles and value
  const totalQuery = `
    SELECT 
      SUM(i.quantity) as total_bottles,
      SUM(i.quantity * p.unit_price) as total_value
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE p.is_active = 1
  `;
  
  const total = await fetchOne(db, totalQuery);
  
  // Get category breakdown
  const categoryQuery = `
    SELECT 
      c.id as category_id,
      c.name as category_name,
      SUM(i.quantity) as total_bottles,
      SUM(i.quantity * p.unit_price) as total_value,
      COUNT(DISTINCT p.id) as product_count
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
    GROUP BY c.id
    ORDER BY c.name
  `;
  
  const categories = await fetchRows(db, categoryQuery);
  
  // Get low stock items count
  const lowStockQuery = `
    SELECT COUNT(*) as count
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE p.is_active = 1 AND i.quantity <= p.minimum_stock
  `;
  
  const lowStock = await fetchOne(db, lowStockQuery);
  
  return {
    total_bottles: total?.total_bottles || 0,
    total_value: total?.total_value || 0,
    categories,
    low_stock_count: lowStock?.count || 0
  };
}

/**
 * Update inventory quantity
 * @param {D1Database} db - The D1 database instance
 * @param {string} productId - Product ID
 * @param {string} locationId - Location ID
 * @param {number} quantity - New quantity
 * @param {string} userId - User ID making the change
 * @returns {Promise<Object>} - Updated inventory entry
 */
export async function updateInventoryQuantity(db, productId, locationId, quantity, userId) {
  // Check if inventory entry exists
  const existingInventory = await fetchOne(
    db,
    'SELECT * FROM inventory WHERE product_id = ? AND location_id = ?',
    [productId, locationId]
  );
  
  const now = new Date().toISOString();
  
  if (existingInventory) {
    // Calculate adjustment amount
    const adjustment = quantity - existingInventory.quantity;
    
    // Update existing entry
    await executeQuery(
      db,
      `UPDATE inventory 
       SET quantity = ?, last_counted = ?, updated_at = ?
       WHERE product_id = ? AND location_id = ?`,
      [quantity, now, now, productId, locationId]
    );
    
    // Record transaction
    await createInventoryTransaction(
      db,
      {
        transaction_type: adjustment > 0 ? 'adjustment' : 'adjustment',
        product_id: productId,
        source_location_id: adjustment < 0 ? locationId : null,
        destination_location_id: adjustment > 0 ? locationId : null,
        quantity: Math.abs(adjustment),
        notes: `Manual quantity adjustment from ${existingInventory.quantity} to ${quantity}`
      },
      userId
    );
  } else {
    // Create new inventory entry
    const id = generateId('inv-');
    
    await executeQuery(
      db,
      `INSERT INTO inventory (id, product_id, location_id, quantity, last_counted, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, productId, locationId, quantity, now, now]
    );
    
    // Record transaction
    await createInventoryTransaction(
      db,
      {
        transaction_type: 'adjustment',
        product_id: productId,
        destination_location_id: locationId,
        quantity: quantity,
        notes: 'Initial inventory setup'
      },
      userId
    );
  }
  
  // Return updated inventory
  return fetchOne(
    db,
    `SELECT i.*, p.name as product_name, l.name as location_name
     FROM inventory i
     JOIN products p ON i.product_id = p.id
     JOIN locations l ON i.location_id = l.id
     WHERE i.product_id = ? AND i.location_id = ?`,
    [productId, locationId]
  );
}

/**
 * Create a new inventory transaction
 * @param {D1Database} db - The D1 database instance
 * @param {Object} transactionData - Transaction data
 * @param {string} userId - User ID creating the transaction
 * @param {string} sessionId - Optional session ID
 * @returns {Promise<Object>} - Created transaction
 */
export async function createInventoryTransaction(db, transactionData, userId, sessionId = null) {
  const {
    transaction_type,
    product_id,
    source_location_id,
    destination_location_id,
    quantity,
    batch_number,
    expiration_date,
    notes
  } = transactionData;
  
  // Generate ID
  const id = generateId('trx-');
  
  // Insert transaction
  await executeQuery(
    db,
    `INSERT INTO inventory_transactions (
      id, transaction_type, product_id, source_location_id, destination_location_id,
      quantity, batch_number, expiration_date, notes, created_by, session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, transaction_type, product_id, source_location_id, destination_location_id,
      quantity, batch_number, expiration_date, notes, userId, sessionId
    ]
  );
  
  // Update inventory based on transaction type
  if (transaction_type === 'check_in' && destination_location_id) {
    await updateInventoryForCheckIn(db, product_id, destination_location_id, quantity);
  } else if (transaction_type === 'check_out' && source_location_id) {
    await updateInventoryForCheckOut(db, product_id, source_location_id, quantity);
  } else if (transaction_type === 'transfer' && source_location_id && destination_location_id) {
    await updateInventoryForTransfer(db, product_id, source_location_id, destination_location_id, quantity);
  }
  
  // Return created transaction
  return getTransactionById(db, id);
}

/**
 * Get transaction by ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - Transaction ID
 * @returns {Promise<Object>} - Transaction data
 */
export async function getTransactionById(db, id) {
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
    WHERE t.id = ?
  `;
  
  return fetchOne(db, query, [id]);
}

/**
 * Update inventory for check-in
 * @param {D1Database} db - The D1 database instance
 * @param {string} productId - Product ID
 * @param {string} locationId - Location ID
 * @param {number} quantity - Quantity to add
 * @returns {Promise<void>}
 */
async function updateInventoryForCheckIn(db, productId, locationId, quantity) {
  const existingInventory = await fetchOne(
    db,
    'SELECT * FROM inventory WHERE product_id = ? AND location_id = ?',
    [productId, locationId]
  );
  
  if (existingInventory) {
    await executeQuery(
      db,
      `UPDATE inventory 
       SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = ? AND location_id = ?`,
      [quantity, productId, locationId]
    );
  } else {
    const id = generateId('inv-');
    await executeQuery(
      db,
      `INSERT INTO inventory (id, product_id, location_id, quantity, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, productId, locationId, quantity]
    );
  }
}

/**
 * Update inventory for check-out
 * @param {D1Database} db - The D1 database instance
 * @param {string} productId - Product ID
 * @param {string} locationId - Location ID
 * @param {number} quantity - Quantity to remove
 * @returns {Promise<void>}
 */
async function updateInventoryForCheckOut(db, productId, locationId, quantity) {
  const existingInventory = await fetchOne(
    db,
    'SELECT * FROM inventory WHERE product_id = ? AND location_id = ?',
    [productId, locationId]
  );
  
  if (!existingInventory) {
    throw new Error('Product not found in this location');
  }
  
  if (existingInventory.quantity < quantity) {
    throw new Error('Insufficient quantity available');
  }
  
  await executeQuery(
    db,
    `UPDATE inventory 
     SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
     WHERE product_id = ? AND location_id = ?`,
    [quantity, productId, locationId]
  );
}

/**
 * Update inventory for transfer
 * @param {D1Database} db - The D1 database instance
 * @param {string} productId - Product ID
 * @param {string} sourceLocationId - Source location ID
 * @param {string} destinationLocationId - Destination location ID
 * @param {number} quantity - Quantity to transfer
 * @returns {Promise<void>}
 */
async function updateInventoryForTransfer(db, productId, sourceLocationId, destinationLocationId, quantity) {
  // Check source inventory
  const sourceInventory = await fetchOne(
    db,
    'SELECT * FROM inventory WHERE product_id = ? AND location_id = ?',
    [productId, sourceLocationId]
  );
  
  if (!sourceInventory) {
    throw new Error('Product not found in source location');
  }
  
  if (sourceInventory.quantity < quantity) {
    throw new Error('Insufficient quantity available for transfer');
  }
  
  // Update source inventory
  await executeQuery(
    db,
    `UPDATE inventory 
     SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
     WHERE product_id = ? AND location_id = ?`,
    [quantity, productId, sourceLocationId]
  );
  
  // Update destination inventory
  const destinationInventory = await fetchOne(
    db,
    'SELECT * FROM inventory WHERE product_id = ? AND location_id = ?',
    [productId, destinationLocationId]
  );
  
  if (destinationInventory) {
    await executeQuery(
      db,
      `UPDATE inventory 
       SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = ? AND location_id = ?`,
      [quantity, productId, destinationLocationId]
    );
  } else {
    const id = generateId('inv-');
    await executeQuery(
      db,
      `INSERT INTO inventory (id, product_id, location_id, quantity, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, productId, destinationLocationId, quantity]
    );
  }
}
