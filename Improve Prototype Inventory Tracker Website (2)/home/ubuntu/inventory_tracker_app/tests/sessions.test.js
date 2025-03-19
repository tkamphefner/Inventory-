// Test script for session management functionality
import { createSession, getSessionById, getSessions, addProductToSession, completeSession } from '../src/lib/sessions';
import { executeQuery } from '../src/lib/db';

// Mock database connection
const mockDB = {
  prepare: jest.fn().mockReturnThis(),
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  exec: jest.fn()
};

describe('Session Management Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('Create session should generate ID and set initial status', async () => {
    // Mock session data
    const sessionData = {
      session_type: 'check-in',
      location_id: 'loc-1',
      notes: 'Test session'
    };
    
    // Mock user ID
    const userId = 'usr-123';
    
    // Mock database responses
    mockDB.run.mockResolvedValueOnce({});
    mockDB.get.mockResolvedValueOnce({
      id: 'ses-123',
      session_type: 'check-in',
      location_id: 'loc-1',
      location_name: 'Main Storage',
      notes: 'Test session',
      status: 'active',
      created_by: 'usr-123',
      created_by_username: 'testuser',
      created_at: '2025-03-16T20:00:00.000Z'
    });
    
    const result = await createSession(mockDB, sessionData, userId);
    
    // Verify session was created with expected values
    expect(result).toHaveProperty('id');
    expect(result.session_type).toBe(sessionData.session_type);
    expect(result.location_id).toBe(sessionData.location_id);
    expect(result.notes).toBe(sessionData.notes);
    expect(result.status).toBe('active');
    expect(result.created_by).toBe(userId);
    
    // Verify database was called with correct parameters
    const dbCall = mockDB.run.mock.calls[0][1];
    expect(dbCall).toContain(sessionData.session_type);
    expect(dbCall).toContain(sessionData.location_id);
    expect(dbCall).toContain(userId);
  });

  test('Get sessions should filter by type and status', async () => {
    // Mock sessions data
    const mockSessions = [
      {
        id: 'ses-123',
        session_type: 'check-in',
        location_id: 'loc-1',
        location_name: 'Main Storage',
        status: 'active',
        created_by: 'usr-123',
        created_by_username: 'testuser',
        created_at: '2025-03-16T20:00:00.000Z',
        item_count: 5
      },
      {
        id: 'ses-124',
        session_type: 'check-in',
        location_id: 'loc-2',
        location_name: 'Secondary Storage',
        status: 'active',
        created_by: 'usr-123',
        created_by_username: 'testuser',
        created_at: '2025-03-16T20:30:00.000Z',
        item_count: 3
      }
    ];
    
    // Mock database response
    mockDB.all.mockResolvedValueOnce(mockSessions);
    
    // Test with type and status filters
    const result = await getSessions(mockDB, {
      session_type: 'check-in',
      status: 'active',
      limit: 10
    });
    
    // Verify correct query parameters were used
    expect(mockDB.all).toHaveBeenCalled();
    const [query, params] = mockDB.all.mock.calls[0];
    expect(query).toContain('WHERE s.session_type = ?');
    expect(query).toContain('AND s.status = ?');
    expect(params).toContain('check-in');
    expect(params).toContain('active');
    expect(params).toContain(10); // limit
    
    // Verify result format
    expect(result).toEqual(mockSessions);
  });

  test('Add product to session should update quantities', async () => {
    // Mock session data
    mockDB.get.mockResolvedValueOnce({
      id: 'ses-123',
      session_type: 'check-in',
      location_id: 'loc-1',
      status: 'active'
    });
    
    // Mock product data
    mockDB.get.mockResolvedValueOnce({
      id: 'prod-1',
      name: 'Test Wine',
      unit_price: 25.99
    });
    
    // Mock successful transaction
    mockDB.run.mockResolvedValueOnce({});
    mockDB.run.mockResolvedValueOnce({});
    
    // Mock session transaction data
    mockDB.get.mockResolvedValueOnce({
      id: 'str-123',
      session_id: 'ses-123',
      product_id: 'prod-1',
      quantity: 5,
      product_name: 'Test Wine',
      unit_price: 25.99
    });
    
    const result = await addProductToSession(
      mockDB,
      'ses-123',
      'prod-1',
      5, // Add 5 units
      'usr-123'
    );
    
    // Verify session transaction was created
    expect(mockDB.run).toHaveBeenCalledTimes(2);
    
    // First call should create session transaction
    const [transactionQuery, transactionParams] = mockDB.run.mock.calls[0];
    expect(transactionQuery).toContain('INSERT INTO session_transactions');
    expect(transactionParams).toContain('ses-123');
    expect(transactionParams).toContain('prod-1');
    expect(transactionParams).toContain(5); // Quantity
    
    // Second call should update inventory (for check-in)
    const [inventoryQuery, inventoryParams] = mockDB.run.mock.calls[1];
    expect(inventoryQuery).toContain('INSERT INTO inventory_transactions');
    
    // Verify result format
    expect(result).toHaveProperty('id', 'str-123');
    expect(result).toHaveProperty('session_id', 'ses-123');
    expect(result).toHaveProperty('product_id', 'prod-1');
    expect(result).toHaveProperty('quantity', 5);
    expect(result).toHaveProperty('product_name', 'Test Wine');
  });

  test('Complete session should update status and finalize inventory', async () => {
    // Mock session data
    mockDB.get.mockResolvedValueOnce({
      id: 'ses-123',
      session_type: 'check-in',
      location_id: 'loc-1',
      status: 'active'
    });
    
    // Mock session transactions
    mockDB.all.mockResolvedValueOnce([
      {
        id: 'str-123',
        session_id: 'ses-123',
        product_id: 'prod-1',
        quantity: 5
      },
      {
        id: 'str-124',
        session_id: 'ses-123',
        product_id: 'prod-2',
        quantity: 3
      }
    ]);
    
    // Mock successful updates
    mockDB.run.mockResolvedValueOnce({});
    
    // Mock completed session data
    mockDB.get.mockResolvedValueOnce({
      id: 'ses-123',
      session_type: 'check-in',
      location_id: 'loc-1',
      location_name: 'Main Storage',
      status: 'completed',
      completed_at: '2025-03-16T21:00:00.000Z',
      completed_by: 'usr-123',
      completed_by_username: 'testuser'
    });
    
    const result = await completeSession(mockDB, 'ses-123', 'usr-123');
    
    // Verify session was updated
    expect(mockDB.run).toHaveBeenCalledTimes(1);
    
    // Call should update session status
    const [updateQuery, updateParams] = mockDB.run.mock.calls[0];
    expect(updateQuery).toContain('UPDATE sessions SET status = ?');
    expect(updateParams).toContain('completed');
    expect(updateParams).toContain('usr-123');
    
    // Verify result format
    expect(result).toHaveProperty('id', 'ses-123');
    expect(result).toHaveProperty('status', 'completed');
    expect(result).toHaveProperty('completed_at');
    expect(result).toHaveProperty('completed_by', 'usr-123');
  });

  test('Complete already completed session should throw error', async () => {
    // Mock already completed session
    mockDB.get.mockResolvedValueOnce({
      id: 'ses-123',
      session_type: 'check-in',
      location_id: 'loc-1',
      status: 'completed'
    });
    
    // Attempt to complete already completed session
    await expect(
      completeSession(mockDB, 'ses-123', 'usr-123')
    ).rejects.toThrow('Session is already completed');
    
    // Verify no updates were made
    expect(mockDB.run).not.toHaveBeenCalled();
  });
});
