-- Migration number: 0001 	 Updated for Factory Management System

-- Drop existing tables if they exist (optional, good for clean slate)
DROP TABLE IF EXISTS SalesRepRegions;
DROP TABLE IF EXISTS SalesOrderDetails;
DROP TABLE IF EXISTS Invoices;
DROP TABLE IF EXISTS Commissions;
DROP TABLE IF EXISTS SalesOrders;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS SalesReps;
DROP TABLE IF EXISTS Drivers;
DROP TABLE IF EXISTS Regions;
DROP TABLE IF EXISTS StockMovements;
DROP TABLE IF EXISTS InventoryLots;
DROP TABLE IF EXISTS StorageLocations;
DROP TABLE IF EXISTS BOMComponents;
DROP TABLE IF EXISTS BOMs;
DROP TABLE IF EXISTS ProductionOrders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS PurchaseOrderDetails;
DROP TABLE IF EXISTS PurchaseOrders;
DROP TABLE IF EXISTS MaterialSuppliers;
DROP TABLE IF EXISTS RawMaterials;
DROP TABLE IF EXISTS Suppliers;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;
DROP TABLE IF EXISTS Notifications;

-- 1. User Management

-- Roles Table
CREATE TABLE Roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL -- (e.g., 'Admin', 'WarehouseStaff', 'SalesRep')
);

-- Users Table
CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Store hashed passwords only!
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone_number TEXT,
    role_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1, -- Use 1 for TRUE in SQLite
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);

-- Initial Data for Roles
INSERT INTO Roles (role_name) VALUES 
  ('Admin'),
  ('WarehouseStaff'),
  ('SalesRep');

-- Add Indexes
CREATE INDEX idx_users_username ON Users(username);
CREATE INDEX idx_users_role_id ON Users(role_id);

-- Note: Other tables from database_schema.md will be added in subsequent migrations.

