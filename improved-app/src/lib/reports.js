// Reporting utility functions for the inventory tracker application
import { fetchRows, fetchOne, executeQuery, generateId } from './db';

/**
 * Get inventory valuation report
 * @param {D1Database} db - The D1 database instance
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Report data
 */
export async function getInventoryValuationReport(db, filters = {}) {
  const { locationId, categoryId } = filters;
  
  let query = `
    SELECT 
      c.id as category_id,
      c.name as category_name,
      SUM(i.quantity) as total_quantity,
      SUM(i.quantity * p.unit_price) as total_value,
      SUM(i.quantity * p.unit_cost) as total_cost,
      SUM(i.quantity * (p.unit_price - p.unit_cost)) as total_profit,
      COUNT(DISTINCT p.id) as product_count
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN categories c ON p.category_id = c.id
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
  
  query += ` GROUP BY c.id ORDER BY c.name`;
  
  const categories = await fetchRows(db, query, params);
  
  // Get total summary
  let summaryQuery = `
    SELECT 
      SUM(i.quantity) as total_quantity,
      SUM(i.quantity * p.unit_price) as total_value,
      SUM(i.quantity * p.unit_cost) as total_cost,
      SUM(i.quantity * (p.unit_price - p.unit_cost)) as total_profit,
      COUNT(DISTINCT p.id) as product_count
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE p.is_active = 1
  `;
  
  const summaryParams = [];
  
  if (locationId) {
    summaryQuery += ` AND i.location_id = ?`;
    summaryParams.push(locationId);
  }
  
  if (categoryId) {
    summaryQuery += ` AND (p.category_id = ? OR c.parent_id = ?)`;
    summaryParams.push(categoryId, categoryId);
  }
  
  const summary = await fetchOne(db, summaryQuery, summaryParams);
  
  return {
    categories,
    summary,
    generated_at: new Date().toISOString(),
    filters
  };
}

/**
 * Get transaction history report
 * @param {D1Database} db - The D1 database instance
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Report data
 */
export async function getTransactionHistoryReport(db, filters = {}) {
  const { 
    startDate, 
    endDate, 
    transactionType, 
    productId, 
    locationId,
    limit = 100,
    offset = 0
  } = filters;
  
  let query = `
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
    WHERE 1=1
  `;
  
  const params = [];
  
  if (startDate) {
    query += ` AND t.created_at >= ?`;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND t.created_at <= ?`;
    params.push(endDate);
  }
  
  if (transactionType) {
    query += ` AND t.transaction_type = ?`;
    params.push(transactionType);
  }
  
  if (productId) {
    query += ` AND t.product_id = ?`;
    params.push(productId);
  }
  
  if (locationId) {
    query += ` AND (t.source_location_id = ? OR t.destination_location_id = ?)`;
    params.push(locationId, locationId);
  }
  
  query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const transactions = await fetchRows(db, query, params);
  
  // Get count for pagination
  let countQuery = `
    SELECT COUNT(*) as count
    FROM inventory_transactions t
    WHERE 1=1
  `;
  
  const countParams = [];
  
  if (startDate) {
    countQuery += ` AND t.created_at >= ?`;
    countParams.push(startDate);
  }
  
  if (endDate) {
    countQuery += ` AND t.created_at <= ?`;
    countParams.push(endDate);
  }
  
  if (transactionType) {
    countQuery += ` AND t.transaction_type = ?`;
    countParams.push(transactionType);
  }
  
  if (productId) {
    countQuery += ` AND t.product_id = ?`;
    countParams.push(productId);
  }
  
  if (locationId) {
    countQuery += ` AND (t.source_location_id = ? OR t.destination_location_id = ?)`;
    countParams.push(locationId, locationId);
  }
  
  const countResult = await fetchOne(db, countQuery, countParams);
  
  return {
    transactions,
    total: countResult?.count || 0,
    limit,
    offset,
    generated_at: new Date().toISOString(),
    filters
  };
}

/**
 * Get low stock report
 * @param {D1Database} db - The D1 database instance
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Report data
 */
export async function getLowStockReport(db, filters = {}) {
  const { locationId, categoryId } = filters;
  
  let query = `
    SELECT i.*, 
           p.name as product_name, p.barcode, p.unit_price, p.unit_cost, 
           p.case_size, p.minimum_stock, p.varietal, p.category_id,
           c.name as category_name,
           l.name as location_name, l.type as location_type
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN locations l ON i.location_id = l.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND i.quantity <= p.minimum_stock
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
  
  query += ` ORDER BY (i.quantity / p.minimum_stock) ASC`;
  
  const items = await fetchRows(db, query, params);
  
  return {
    items,
    count: items.length,
    generated_at: new Date().toISOString(),
    filters
  };
}

/**
 * Save a report
 * @param {D1Database} db - The D1 database instance
 * @param {Object} reportData - Report data
 * @param {string} userId - User ID creating the report
 * @returns {Promise<Object>} - Created report
 */
export async function saveReport(db, reportData, userId) {
  const { name, report_type, parameters, schedule } = reportData;
  
  // Generate ID
  const id = generateId('rep-');
  
  // Insert report
  await executeQuery(
    db,
    `INSERT INTO reports (
      id, name, report_type, parameters, created_by, schedule, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [id, name, report_type, JSON.stringify(parameters), userId, schedule]
  );
  
  // Return created report
  return getReportById(db, id);
}

/**
 * Get report by ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - Report ID
 * @returns {Promise<Object>} - Report data
 */
export async function getReportById(db, id) {
  const query = `
    SELECT r.*, u.username as created_by_username
    FROM reports r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.id = ?
  `;
  
  const report = await fetchOne(db, query, [id]);
  
  if (report && report.parameters) {
    try {
      report.parameters = JSON.parse(report.parameters);
    } catch (error) {
      console.error('Error parsing report parameters:', error);
    }
  }
  
  return report;
}

/**
 * Get saved reports
 * @param {D1Database} db - The D1 database instance
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of reports
 */
export async function getSavedReports(db, filters = {}) {
  const { report_type, userId } = filters;
  
  let query = `
    SELECT r.*, u.username as created_by_username
    FROM reports r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.is_active = 1
  `;
  
  const params = [];
  
  if (report_type) {
    query += ` AND r.report_type = ?`;
    params.push(report_type);
  }
  
  if (userId) {
    query += ` AND r.created_by = ?`;
    params.push(userId);
  }
  
  query += ` ORDER BY r.created_at DESC`;
  
  const reports = await fetchRows(db, query, params);
  
  // Parse parameters
  for (const report of reports) {
    if (report.parameters) {
      try {
        report.parameters = JSON.parse(report.parameters);
      } catch (error) {
        console.error('Error parsing report parameters:', error);
      }
    }
  }
  
  return reports;
}

/**
 * Run a saved report
 * @param {D1Database} db - The D1 database instance
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} - Report results
 */
export async function runSavedReport(db, reportId) {
  const report = await getReportById(db, reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  // Update last run timestamp
  await executeQuery(
    db,
    'UPDATE reports SET last_run = CURRENT_TIMESTAMP WHERE id = ?',
    [reportId]
  );
  
  // Run report based on type
  switch (report.report_type) {
    case 'inventory':
      return getInventoryValuationReport(db, report.parameters || {});
    case 'transaction':
      return getTransactionHistoryReport(db, report.parameters || {});
    case 'valuation':
      return getInventoryValuationReport(db, report.parameters || {});
    default:
      throw new Error(`Unsupported report type: ${report.report_type}`);
  }
}
