// Product management utility functions for the inventory tracker application
import { fetchRows, fetchOne, executeQuery, generateId } from './db';

/**
 * Get all products with optional filtering
 * @param {D1Database} db - The D1 database instance
 * @param {Object} filters - Optional filters (category, search term, etc.)
 * @returns {Promise<Array>} - Array of products
 */
export async function getProducts(db, filters = {}) {
  const { categoryId, search, active = true, limit = 100, offset = 0 } = filters;
  
  let query = `
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (categoryId) {
    query += ` AND (p.category_id = ? OR c.parent_id = ?)`;
    params.push(categoryId, categoryId);
  }
  
  if (search) {
    query += ` AND (p.name LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (active !== null) {
    query += ` AND p.is_active = ?`;
    params.push(active ? 1 : 0);
  }
  
  query += ` ORDER BY p.name LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  return fetchRows(db, query, params);
}

/**
 * Get product by ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - Product ID
 * @returns {Promise<Object>} - Product data
 */
export async function getProductById(db, id) {
  const query = `
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
  `;
  
  return fetchOne(db, query, [id]);
}

/**
 * Get product by barcode
 * @param {D1Database} db - The D1 database instance
 * @param {string} barcode - Product barcode
 * @returns {Promise<Object>} - Product data
 */
export async function getProductByBarcode(db, barcode) {
  const query = `
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.barcode = ?
  `;
  
  return fetchOne(db, query, [barcode]);
}

/**
 * Create a new product
 * @param {D1Database} db - The D1 database instance
 * @param {Object} productData - Product data
 * @param {string} userId - ID of user creating the product
 * @returns {Promise<Object>} - Created product
 */
export async function createProduct(db, productData, userId) {
  const {
    name,
    barcode,
    description,
    category_id,
    supplier_id,
    unit_price,
    unit_cost,
    case_size,
    minimum_stock,
    image_url,
    varietal,
    vintage,
    region,
  } = productData;
  
  // Check if barcode already exists
  if (barcode) {
    const existingProduct = await fetchOne(
      db,
      'SELECT id FROM products WHERE barcode = ?',
      [barcode]
    );
    
    if (existingProduct) {
      throw new Error('Product with this barcode already exists');
    }
  }
  
  // Generate ID
  const id = generateId('prod-');
  
  // Insert product
  await executeQuery(
    db,
    `INSERT INTO products (
      id, name, barcode, description, category_id, supplier_id,
      unit_price, unit_cost, case_size, minimum_stock, image_url,
      varietal, vintage, region, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, name, barcode, description, category_id, supplier_id,
      unit_price, unit_cost, case_size, minimum_stock, image_url,
      varietal, vintage, region, userId
    ]
  );
  
  // Return created product
  return getProductById(db, id);
}

/**
 * Update a product
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - Product ID
 * @param {Object} productData - Updated product data
 * @returns {Promise<Object>} - Updated product
 */
export async function updateProduct(db, id, productData) {
  // Check if product exists
  const existingProduct = await getProductById(db, id);
  if (!existingProduct) {
    throw new Error('Product not found');
  }
  
  // Check if barcode is being changed and already exists
  if (productData.barcode && productData.barcode !== existingProduct.barcode) {
    const productWithBarcode = await fetchOne(
      db,
      'SELECT id FROM products WHERE barcode = ? AND id != ?',
      [productData.barcode, id]
    );
    
    if (productWithBarcode) {
      throw new Error('Product with this barcode already exists');
    }
  }
  
  // Build update query
  const updates = [];
  const params = [];
  
  for (const [key, value] of Object.entries(productData)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'created_by') {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }
  
  if (updates.length === 0) {
    return existingProduct;
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  
  // Execute update
  const query = `
    UPDATE products
    SET ${updates.join(', ')}
    WHERE id = ?
  `;
  
  params.push(id);
  await executeQuery(db, query, params);
  
  // Return updated product
  return getProductById(db, id);
}

/**
 * Delete a product (soft delete by setting is_active to false)
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - Product ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteProduct(db, id) {
  // Check if product exists
  const existingProduct = await getProductById(db, id);
  if (!existingProduct) {
    throw new Error('Product not found');
  }
  
  // Soft delete
  await executeQuery(
    db,
    'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  );
  
  return true;
}

/**
 * Get inventory levels for a product across all locations
 * @param {D1Database} db - The D1 database instance
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} - Array of inventory entries
 */
export async function getProductInventory(db, productId) {
  const query = `
    SELECT i.*, l.name as location_name, l.type as location_type
    FROM inventory i
    JOIN locations l ON i.location_id = l.id
    WHERE i.product_id = ?
  `;
  
  return fetchRows(db, query, [productId]);
}

/**
 * Get categories with optional parent filter
 * @param {D1Database} db - The D1 database instance
 * @param {string} parentId - Optional parent category ID
 * @returns {Promise<Array>} - Array of categories
 */
export async function getCategories(db, parentId = null) {
  let query = 'SELECT * FROM categories';
  const params = [];
  
  if (parentId === null) {
    query += ' WHERE parent_id IS NULL';
  } else if (parentId) {
    query += ' WHERE parent_id = ?';
    params.push(parentId);
  }
  
  query += ' ORDER BY name';
  
  return fetchRows(db, query, params);
}

/**
 * Get category by ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - Category ID
 * @returns {Promise<Object>} - Category data
 */
export async function getCategoryById(db, id) {
  return fetchOne(db, 'SELECT * FROM categories WHERE id = ?', [id]);
}
