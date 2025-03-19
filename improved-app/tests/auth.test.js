// Test script for authentication functionality
import { authenticateUser, createUser, getUserById } from '../src/lib/auth';
import { executeQuery } from '../src/lib/db';

// Mock database connection
const mockDB = {
  prepare: jest.fn().mockReturnThis(),
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  exec: jest.fn()
};

// Setup test data
const testUser = {
  username: 'testuser',
  password: 'password123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'staff'
};

describe('Authentication Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('User creation should generate ID and hash password', async () => {
    // Mock the database response
    mockDB.run.mockResolvedValueOnce({ lastID: 1 });
    mockDB.get.mockResolvedValueOnce({
      id: 'usr-123456',
      username: testUser.username,
      email: testUser.email,
      full_name: testUser.full_name,
      role: testUser.role,
      is_active: 1
    });

    const result = await createUser(mockDB, testUser);

    // Verify user was created with expected values
    expect(result).toHaveProperty('id');
    expect(result.username).toBe(testUser.username);
    expect(result.email).toBe(testUser.email);
    expect(result.full_name).toBe(testUser.full_name);
    expect(result.role).toBe(testUser.role);
    expect(result.is_active).toBe(true);
    
    // Password should not be returned
    expect(result).not.toHaveProperty('password');
    
    // Verify database was called with hashed password (not plaintext)
    const dbCall = mockDB.run.mock.calls[0][1];
    expect(dbCall).not.toContain(testUser.password);
  });

  test('Authentication should succeed with correct credentials', async () => {
    // Mock the database response with hashed password
    const hashedPassword = '$2b$10$abcdefghijklmnopqrstuv'; // Example bcrypt hash
    mockDB.get.mockResolvedValueOnce({
      id: 'usr-123456',
      username: testUser.username,
      password: hashedPassword,
      email: testUser.email,
      full_name: testUser.full_name,
      role: testUser.role,
      is_active: 1
    });
    
    // Mock bcrypt compare to return true for correct password
    jest.mock('bcrypt', () => ({
      compare: jest.fn().mockResolvedValue(true)
    }));

    const result = await authenticateUser(mockDB, testUser.username, testUser.password);

    // Verify authentication succeeded
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('user');
    expect(result.user.username).toBe(testUser.username);
    
    // Password should not be returned
    expect(result.user).not.toHaveProperty('password');
  });

  test('Authentication should fail with incorrect credentials', async () => {
    // Mock the database response with hashed password
    const hashedPassword = '$2b$10$abcdefghijklmnopqrstuv'; // Example bcrypt hash
    mockDB.get.mockResolvedValueOnce({
      id: 'usr-123456',
      username: testUser.username,
      password: hashedPassword,
      email: testUser.email,
      full_name: testUser.full_name,
      role: testUser.role,
      is_active: 1
    });
    
    // Mock bcrypt compare to return false for incorrect password
    jest.mock('bcrypt', () => ({
      compare: jest.fn().mockResolvedValue(false)
    }));

    // Authentication should throw an error
    await expect(
      authenticateUser(mockDB, testUser.username, 'wrongpassword')
    ).rejects.toThrow('Invalid username or password');
  });

  test('Authentication should fail for inactive user', async () => {
    // Mock the database response with inactive user
    const hashedPassword = '$2b$10$abcdefghijklmnopqrstuv'; // Example bcrypt hash
    mockDB.get.mockResolvedValueOnce({
      id: 'usr-123456',
      username: testUser.username,
      password: hashedPassword,
      email: testUser.email,
      full_name: testUser.full_name,
      role: testUser.role,
      is_active: 0
    });

    // Authentication should throw an error
    await expect(
      authenticateUser(mockDB, testUser.username, testUser.password)
    ).rejects.toThrow('User account is inactive');
  });

  test('Get user by ID should return user without password', async () => {
    // Mock the database response
    mockDB.get.mockResolvedValueOnce({
      id: 'usr-123456',
      username: testUser.username,
      password: 'hashedpassword',
      email: testUser.email,
      full_name: testUser.full_name,
      role: testUser.role,
      is_active: 1
    });

    const result = await getUserById(mockDB, 'usr-123456');

    // Verify user data is returned correctly
    expect(result.id).toBe('usr-123456');
    expect(result.username).toBe(testUser.username);
    expect(result.email).toBe(testUser.email);
    
    // Password should not be returned
    expect(result).not.toHaveProperty('password');
  });
});
