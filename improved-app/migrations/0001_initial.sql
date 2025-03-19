-- Initial database schema for Inventory Tracker
-- This file will create all necessary tables for the application

-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;

-- Create Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT CHECK(role IN ('admin', 'manager', 'staff')) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  active BOOLEAN DEFAULT 1
);

-- Create Locations table
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('main_storage', 'outlet', 'warehouse', 'other')) NOT NULL,
  description TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id)
);

-- Create Departments table
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id)
);

-- Create Suppliers table
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id)
);

-- Create Categories table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES categories(id),
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  description TEXT,
  category_id TEXT REFERENCES categories(id),
  supplier_id TEXT REFERENCES suppliers(id),
  unit_price DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  case_size INTEGER,
  minimum_stock INTEGER DEFAULT 0,
  image_url TEXT,
  varietal TEXT,
  vintage TEXT,
  region TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id)
);

-- Create Inventory table
CREATE TABLE inventory (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  location_id TEXT REFERENCES locations(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  last_counted TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, location_id)
);

-- Create Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  session_type TEXT CHECK(session_type IN ('check_in', 'check_out', 'inventory_count')) NOT NULL,
  status TEXT CHECK(status IN ('in_progress', 'completed', 'cancelled')) NOT NULL,
  location_id TEXT REFERENCES locations(id),
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_by TEXT REFERENCES users(id),
  notes TEXT
);

-- Create Inventory_Transactions table
CREATE TABLE inventory_transactions (
  id TEXT PRIMARY KEY,
  transaction_type TEXT CHECK(transaction_type IN ('check_in', 'check_out', 'adjustment', 'transfer')) NOT NULL,
  product_id TEXT REFERENCES products(id),
  source_location_id TEXT REFERENCES locations(id),
  destination_location_id TEXT REFERENCES locations(id),
  quantity INTEGER NOT NULL,
  batch_number TEXT,
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id),
  session_id TEXT REFERENCES sessions(id)
);

-- Create Reports table
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  report_type TEXT CHECK(report_type IN ('inventory', 'transaction', 'valuation', 'custom')) NOT NULL,
  parameters TEXT, -- JSON string
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id),
  last_run TIMESTAMP,
  schedule TEXT,
  is_active BOOLEAN DEFAULT 1
);

-- Create Settings table
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  setting_key TEXT NOT NULL,
  setting_value TEXT, -- JSON string
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, setting_key)
);

-- Create Audit_Logs table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT, -- JSON string
  ip_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (id, username, password_hash, email, full_name, role)
VALUES ('admin-001', 'admin', '$2a$10$JwXdZpLK1dFJBoGdA.4Xz.5Ef.Z9ueVA.PZAxqdQ4BFQyuL6XCnSy', 'admin@example.com', 'System Administrator', 'admin');

-- Insert default categories
INSERT INTO categories (id, name, description)
VALUES 
('cat-001', 'Wine', 'All types of wine'),
('cat-002', 'Liquor', 'Spirits and hard liquor'),
('cat-003', 'Beer', 'Beer and malt beverages'),
('cat-004', 'Other', 'Other inventory items');

-- Insert wine subcategories
INSERT INTO categories (id, name, parent_id, description)
VALUES 
('cat-101', 'Red Wine', 'cat-001', 'Red wine varieties'),
('cat-102', 'White Wine', 'cat-001', 'White wine varieties'),
('cat-103', 'Rosé', 'cat-001', 'Rosé wine varieties'),
('cat-104', 'Sparkling', 'cat-001', 'Sparkling wine and champagne');

-- Insert liquor subcategories
INSERT INTO categories (id, name, parent_id, description)
VALUES 
('cat-201', 'Whiskey', 'cat-002', 'Whiskey and bourbon'),
('cat-202', 'Vodka', 'cat-002', 'Vodka varieties'),
('cat-203', 'Rum', 'cat-002', 'Rum varieties'),
('cat-204', 'Tequila', 'cat-002', 'Tequila and mezcal'),
('cat-205', 'Gin', 'cat-002', 'Gin varieties');

-- Insert default location
INSERT INTO locations (id, name, type, description, created_by)
VALUES ('loc-001', 'Main Storage', 'main_storage', 'Primary storage location for inventory', 'admin-001');

-- Insert sample products
INSERT INTO products (id, name, barcode, description, category_id, unit_price, unit_cost, case_size, varietal, created_by)
VALUES 
('prod-001', 'Test Cab', 'CAB123456', 'Cabernet Sauvignon test product', 'cat-101', 45.00, 30.00, 12, 'Cabernet Sauvignon', 'admin-001'),
('prod-002', 'Chardonnay', 'CHAR123456', 'Chardonnay test product', 'cat-102', 35.00, 22.00, 12, 'Chardonnay', 'admin-001');

-- Insert initial inventory
INSERT INTO inventory (id, product_id, location_id, quantity)
VALUES 
('inv-001', 'prod-001', 'loc-001', 12),
('inv-002', 'prod-002', 'loc-001', 24);
