// Test script for reporting functionality
import { generateReport, getReportById, getSavedReports, saveReport } from '../src/lib/reports';
import { executeQuery } from '../src/lib/db';

// Mock database connection
const mockDB = {
  prepare: jest.fn().mockReturnThis(),
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  exec: jest.fn()
};

describe('Reporting Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('Generate inventory valuation report should return correct data', async () => {
    // Mock inventory data for report
    const mockInventoryData = [
      {
        category_name: 'Wine',
        product_count: 10,
        total_quantity: 50,
        total_value: 1299.50,
        total_cost: 750.00,
        profit_margin: 42.3
      },
      {
        category_name: 'Liquor',
        product_count: 8,
        total_quantity: 24,
        total_value: 839.76,
        total_cost: 492.00,
        profit_margin: 41.4
      },
      {
        category_name: 'Beer',
        product_count: 5,
        total_quantity: 120,
        total_value: 599.40,
        total_cost: 360.00,
        profit_margin: 39.9
      }
    ];
    
    // Mock database response
    mockDB.all.mockResolvedValueOnce(mockInventoryData);
    
    // Generate inventory valuation report
    const result = await generateReport(mockDB, {
      report_type: 'inventory',
      parameters: {
        location_id: 'loc-1'
      },
      user_id: 'usr-123'
    });
    
    // Verify correct query was executed
    expect(mockDB.all).toHaveBeenCalled();
    const [query, params] = mockDB.all.mock.calls[0];
    expect(query).toContain('GROUP BY c.name');
    expect(params).toContain('loc-1');
    
    // Verify report format
    expect(result).toHaveProperty('report_type', 'inventory');
    expect(result).toHaveProperty('generated_at');
    expect(result).toHaveProperty('generated_by', 'usr-123');
    expect(result).toHaveProperty('data');
    expect(result.data).toEqual(mockInventoryData);
    
    // Verify totals calculation
    expect(result).toHaveProperty('summary');
    expect(result.summary).toHaveProperty('total_product_count', 23);
    expect(result.summary).toHaveProperty('total_quantity', 194);
    expect(result.summary).toHaveProperty('total_value', 2738.66);
  });

  test('Generate low stock report should identify products below minimum', async () => {
    // Mock low stock data
    const mockLowStockData = [
      {
        product_id: 'prod-1',
        product_name: 'Test Wine',
        category_name: 'Wine',
        current_quantity: 2,
        minimum_stock: 5,
        unit_price: 25.99,
        location_name: 'Main Storage'
      },
      {
        product_id: 'prod-2',
        product_name: 'Test Liquor',
        category_name: 'Liquor',
        current_quantity: 1,
        minimum_stock: 3,
        unit_price: 35.99,
        location_name: 'Main Storage'
      }
    ];
    
    // Mock database response
    mockDB.all.mockResolvedValueOnce(mockLowStockData);
    
    // Generate low stock report
    const result = await generateReport(mockDB, {
      report_type: 'low_stock',
      parameters: {},
      user_id: 'usr-123'
    });
    
    // Verify correct query was executed
    expect(mockDB.all).toHaveBeenCalled();
    const [query] = mockDB.all.mock.calls[0];
    expect(query).toContain('WHERE i.quantity < p.minimum_stock');
    
    // Verify report format
    expect(result).toHaveProperty('report_type', 'low_stock');
    expect(result).toHaveProperty('data');
    expect(result.data).toEqual(mockLowStockData);
    
    // Verify summary calculation
    expect(result).toHaveProperty('summary');
    expect(result.summary).toHaveProperty('total_low_stock_items', 2);
  });

  test('Save report should store report definition', async () => {
    // Mock report data
    const reportData = {
      name: 'Monthly Inventory Valuation',
      report_type: 'inventory',
      parameters: {
        location_id: 'loc-1'
      },
      schedule: 'monthly',
      user_id: 'usr-123'
    };
    
    // Mock database responses
    mockDB.run.mockResolvedValueOnce({});
    mockDB.get.mockResolvedValueOnce({
      id: 'rep-123',
      name: 'Monthly Inventory Valuation',
      report_type: 'inventory',
      parameters: JSON.stringify({
        location_id: 'loc-1'
      }),
      schedule: 'monthly',
      created_by: 'usr-123',
      created_by_username: 'testuser',
      created_at: '2025-03-16T20:00:00.000Z'
    });
    
    const result = await saveReport(mockDB, reportData);
    
    // Verify report was saved with expected values
    expect(result).toHaveProperty('id', 'rep-123');
    expect(result).toHaveProperty('name', reportData.name);
    expect(result).toHaveProperty('report_type', reportData.report_type);
    expect(result).toHaveProperty('schedule', reportData.schedule);
    expect(result).toHaveProperty('created_by', reportData.user_id);
    
    // Verify parameters were stored as JSON
    expect(result).toHaveProperty('parameters');
    expect(typeof result.parameters).toBe('string');
    expect(JSON.parse(result.parameters)).toEqual(reportData.parameters);
  });

  test('Get saved reports should return reports with parsed parameters', async () => {
    // Mock saved reports data
    const mockReports = [
      {
        id: 'rep-123',
        name: 'Monthly Inventory Valuation',
        report_type: 'inventory',
        parameters: JSON.stringify({
          location_id: 'loc-1'
        }),
        schedule: 'monthly',
        created_by: 'usr-123',
        created_by_username: 'testuser',
        created_at: '2025-03-16T20:00:00.000Z',
        last_run: null
      },
      {
        id: 'rep-124',
        name: 'Weekly Low Stock Alert',
        report_type: 'low_stock',
        parameters: JSON.stringify({}),
        schedule: 'weekly',
        created_by: 'usr-123',
        created_by_username: 'testuser',
        created_at: '2025-03-16T20:30:00.000Z',
        last_run: '2025-03-16T21:00:00.000Z'
      }
    ];
    
    // Mock database response
    mockDB.all.mockResolvedValueOnce(mockReports);
    
    // Get saved reports
    const result = await getSavedReports(mockDB, {
      user_id: 'usr-123'
    });
    
    // Verify correct query parameters were used
    expect(mockDB.all).toHaveBeenCalled();
    const [query, params] = mockDB.all.mock.calls[0];
    expect(query).toContain('WHERE r.created_by = ?');
    expect(params).toContain('usr-123');
    
    // Verify result format and parameter parsing
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('id', 'rep-123');
    expect(result[0]).toHaveProperty('parameters');
    expect(typeof result[0].parameters).toBe('object');
    expect(result[0].parameters).toHaveProperty('location_id', 'loc-1');
  });
});
