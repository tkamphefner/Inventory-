// Test script for inventory management functionality
import { getInventory, getInventorySummary, updateInventoryQuantity } from '../src/lib/inventory';
import { executeQuery } from '../src/lib/db';

// Mock database connection
const mockDB = {
  prepare: jest.fn().mockReturnThis(),
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  exec: jest.fn()
};

describe('Inventory Management Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('Get inventory should return filtered inventory items', async () => {
    // Mock inventory data
    const mockInventoryData = [
      {
        id: 'inv-123',
        product_id: 'prod-1',
        location_id: 'loc-1',
        quantity: 10,
        product_name: 'Test Wine',
        category_name: 'Wine',
        unit_price: 25.99,
        unit_cost: 15.50,
        minimum_stock: 5
      },
      {
        id: 'inv-124',
        product_id: 'prod-2',
        location_id: 'loc-1',
        quantity: 3,
        product_name: 'Test Liquor',
        category_name: 'Liquor',
        unit_price: 35.99,
        unit_cost: 20.50,
        minimum_stock: 5
      }
    ];
    
    // Mock database response
    mockDB.all.mockResolvedValueOnce(mockInventoryData);
    
    // Test with category filter
    const result = await getInventory(mockDB, { categoryId: 'Wine' });
    
    // Verify correct query parameters were used
    expect(mockDB.all).toHaveBeenCalled();
    const [query, params] = mockDB.all.mock.calls[0];
    expect(query).toContain('JOIN categories c ON p.category_id = c.id');
    expect(params).toContain('Wine');
    
    // Verify result format
    expect(result).toEqual(mockInventoryData);
  });

  test('Get inventory summary should return correct totals', async () => {
    // Mock summary data
    const mockSummaryData = {
      totalQuantity: 36,
      totalValue: 2820.00,
      totalCost: 1650.00,
      totalProfit: 1170.00,
      lowStockCount: 3,
      categoryBreakdown: [
        { category_name: 'Wine', total_quantity: 20, total_value: 1500.00 },
        { category_name: 'Liquor', total_quantity: 10, total_value: 900.00 },
        { category_name: 'Beer', total_quantity: 6, total_value: 420.00 }
      ]
    };
    
    // Mock database responses
    mockDB.get.mockResolvedValueOnce({
      totalQuantity: 36,
      totalValue: 2820.00,
      totalCost: 1650.00,
      totalProfit: 1170.00
    });
    
    mockDB.get.mockResolvedValueOnce({ count: 3 });
    
    mockDB.all.mockResolvedValueOnce([
      { category_name: 'Wine', total_quantity: 20, total_value: 1500.00 },
      { category_name: 'Liquor', total_quantity: 10, total_value: 900.00 },
      { category_name: 'Beer', total_quantity: 6, total_value: 420.00 }
    ]);
    
    const result = await getInventorySummary(mockDB);
    
    // Verify database was queried correctly
    expect(mockDB.get).toHaveBeenCalledTimes(2);
    expect(mockDB.all).toHaveBeenCalledTimes(1);
    
    // Verify summary data format
    expect(result).toHaveProperty('totalQuantity', 36);
    expect(result).toHaveProperty('totalValue', 2820.00);
    expect(result).toHaveProperty('lowStockCount', 3);
    expect(result).toHaveProperty('categoryBreakdown');
    expect(result.categoryBreakdown).toHaveLength(3);
  });

  test('Update inventory quantity should create transaction record', async () => {
    // Mock existing inventory data
    mockDB.get.mockResolvedValueOnce({
      id: 'inv-123',
      product_id: 'prod-1',
      location_id: 'loc-1',
      quantity: 10
    });
    
    // Mock successful update
    mockDB.run.mockResolvedValueOnce({});
    mockDB.run.mockResolvedValueOnce({});
    
    // Mock updated inventory data
    mockDB.get.mockResolvedValueOnce({
      id: 'inv-123',
      product_id: 'prod-1',
      location_id: 'loc-1',
      quantity: 15,
      product_name: 'Test Wine',
      category_name: 'Wine',
      unit_price: 25.99
    });
    
    const result = await updateInventoryQuantity(
      mockDB, 
      'prod-1', 
      'loc-1', 
      5, // Add 5 units
      'usr-123'
    );
    
    // Verify inventory was updated
    expect(mockDB.run).toHaveBeenCalledTimes(2);
    
    // First call should update inventory
    const [updateQuery, updateParams] = mockDB.run.mock.calls[0];
    expect(updateQuery).toContain('UPDATE inventory');
    expect(updateParams).toContain(15); // 10 + 5
    
    // Second call should create transaction record
    const [transactionQuery, transactionParams] = mockDB.run.mock.calls[1];
    expect(transactionQuery).toContain('INSERT INTO inventory_transactions');
    expect(transactionParams).toContain('prod-1');
    expect(transactionParams).toContain('loc-1');
    expect(transactionParams).toContain(5); // Quantity change
    
    // Verify result format
    expect(result).toHaveProperty('id', 'inv-123');
    expect(result).toHaveProperty('quantity', 15);
    expect(result).toHaveProperty('product_name', 'Test Wine');
  });

  test('Update inventory with negative quantity should throw error', async () => {
    // Mock existing inventory data
    mockDB.get.mockResolvedValueOnce({
      id: 'inv-123',
      product_id: 'prod-1',
      location_id: 'loc-1',
      quantity: 10
    });
    
    // Attempt to remove more than available
    await expect(
      updateInventoryQuantity(mockDB, 'prod-1', 'loc-1', -15, 'usr-123')
    ).rejects.toThrow('Insufficient inventory');
    
    // Verify no updates were made
    expect(mockDB.run).not.toHaveBeenCalled();
  });
});
