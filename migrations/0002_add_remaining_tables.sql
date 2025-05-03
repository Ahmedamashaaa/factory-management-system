-- Migration number: 0002 	 Add remaining tables for Factory Management System

-- 2. Raw Materials and Suppliers

CREATE TABLE Suppliers (
    supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone_number TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE RawMaterials (
    material_id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_code TEXT UNIQUE,
    material_name TEXT NOT NULL,
    description TEXT,
    unit_of_measure TEXT NOT NULL,
    reorder_level REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE MaterialSuppliers (
    material_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    last_price REAL,
    PRIMARY KEY (material_id, supplier_id),
    FOREIGN KEY (material_id) REFERENCES RawMaterials(material_id),
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
);

CREATE TABLE PurchaseOrders (
    po_id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_date TEXT NOT NULL, -- Using TEXT for DATE
    expected_delivery_date TEXT, -- Using TEXT for DATE
    status TEXT NOT NULL DEFAULT 'Pending', -- (Pending, Ordered, Partially Received, Received, Cancelled)
    total_amount REAL,
    created_by_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id),
    FOREIGN KEY (created_by_user_id) REFERENCES Users(user_id)
);

CREATE TABLE PurchaseOrderDetails (
    pod_id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    received_quantity REAL DEFAULT 0,
    FOREIGN KEY (po_id) REFERENCES PurchaseOrders(po_id),
    FOREIGN KEY (material_id) REFERENCES RawMaterials(material_id)
);

-- 3. Products and Production

CREATE TABLE Products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_code TEXT UNIQUE,
    product_name TEXT NOT NULL,
    description TEXT,
    unit_of_measure TEXT NOT NULL,
    selling_price REAL NOT NULL,
    reorder_level REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE BOMs (
    bom_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE BOMComponents (
    bom_component_id INTEGER PRIMARY KEY AUTOINCREMENT,
    bom_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity_required REAL NOT NULL,
    FOREIGN KEY (bom_id) REFERENCES BOMs(bom_id),
    FOREIGN KEY (material_id) REFERENCES RawMaterials(material_id)
);

CREATE TABLE ProductionOrders (
    prod_order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prod_order_number TEXT UNIQUE NOT NULL,
    product_id INTEGER NOT NULL,
    quantity_to_produce REAL NOT NULL,
    order_date TEXT NOT NULL, -- Using TEXT for DATE
    start_date TEXT, -- Using TEXT for DATE
    completion_date TEXT, -- Using TEXT for DATE
    status TEXT NOT NULL DEFAULT 'Planned', -- (Planned, In Progress, Completed, Cancelled)
    created_by_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (created_by_user_id) REFERENCES Users(user_id)
);

-- 4. Inventory Management

CREATE TABLE StorageLocations (
    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_code TEXT UNIQUE NOT NULL,
    location_name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE InventoryLots (
    lot_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL, -- ('RawMaterial', 'Product')
    item_id INTEGER NOT NULL,
    location_id INTEGER,
    quantity_received REAL NOT NULL,
    current_quantity REAL NOT NULL,
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date TEXT, -- Using TEXT for DATE
    purchase_order_detail_id INTEGER,
    production_order_id INTEGER,
    cost_per_unit REAL,
    FOREIGN KEY (location_id) REFERENCES StorageLocations(location_id),
    FOREIGN KEY (purchase_order_detail_id) REFERENCES PurchaseOrderDetails(pod_id),
    FOREIGN KEY (production_order_id) REFERENCES ProductionOrders(prod_order_id)
);

CREATE TABLE StockMovements (
    movement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL, -- ('RawMaterial', 'Product')
    item_id INTEGER NOT NULL,
    lot_id INTEGER,
    movement_type TEXT NOT NULL, -- (Receipt, Issue, Transfer, Adjustment)
    quantity REAL NOT NULL,
    movement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_document_type TEXT,
    related_document_id INTEGER,
    user_id INTEGER,
    notes TEXT,
    FOREIGN KEY (lot_id) REFERENCES InventoryLots(lot_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL, -- ('RawMaterial', 'Product')
    item_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0, -- Use 0 for FALSE in SQLite
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customers and Regions

CREATE TABLE Regions (
    region_id INTEGER PRIMARY KEY AUTOINCREMENT,
    region_name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- 6. Sales Reps, Drivers, Sales

CREATE TABLE SalesReps (
    sales_rep_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    employee_code TEXT UNIQUE,
    commission_rate REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_code TEXT UNIQUE,
    customer_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone_number TEXT,
    address TEXT,
    region_id INTEGER,
    assigned_sales_rep_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES Regions(region_id),
    FOREIGN KEY (assigned_sales_rep_id) REFERENCES SalesReps(sales_rep_id)
);

CREATE TABLE SalesRepRegions (
    sales_rep_id INTEGER NOT NULL,
    region_id INTEGER NOT NULL,
    PRIMARY KEY (sales_rep_id, region_id),
    FOREIGN KEY (sales_rep_id) REFERENCES SalesReps(sales_rep_id),
    FOREIGN KEY (region_id) REFERENCES Regions(region_id)
);

CREATE TABLE Drivers (
    driver_id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_name TEXT NOT NULL,
    phone_number TEXT,
    license_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE SalesOrders (
    so_id INTEGER PRIMARY KEY AUTOINCREMENT,
    so_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    sales_rep_id INTEGER NOT NULL,
    order_date TEXT NOT NULL, -- Using TEXT for DATE
    delivery_date TEXT, -- Using TEXT for DATE
    status TEXT NOT NULL DEFAULT 'Pending', -- (Pending, Confirmed, Shipped, Delivered, Cancelled)
    total_amount REAL,
    driver_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (sales_rep_id) REFERENCES SalesReps(sales_rep_id),
    FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id)
);

CREATE TABLE SalesOrderDetails (
    sod_id INTEGER PRIMARY KEY AUTOINCREMENT,
    so_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount REAL DEFAULT 0,
    FOREIGN KEY (so_id) REFERENCES SalesOrders(so_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE Invoices (
    invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    so_id INTEGER NOT NULL,
    invoice_date TEXT NOT NULL, -- Using TEXT for DATE
    due_date TEXT, -- Using TEXT for DATE
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Unpaid', -- (Unpaid, Partially Paid, Paid, Overdue)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (so_id) REFERENCES SalesOrders(so_id)
);

CREATE TABLE Commissions (
    commission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sales_rep_id INTEGER NOT NULL,
    invoice_id INTEGER NOT NULL,
    commission_amount REAL NOT NULL,
    calculation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Pending', -- (Pending, Paid)
    FOREIGN KEY (sales_rep_id) REFERENCES SalesReps(sales_rep_id),
    FOREIGN KEY (invoice_id) REFERENCES Invoices(invoice_id)
);

-- Add Indexes for performance
CREATE INDEX idx_rawmaterials_name ON RawMaterials(material_name);
CREATE INDEX idx_products_name ON Products(product_name);
CREATE INDEX idx_inventorylots_item ON InventoryLots(item_type, item_id);
CREATE INDEX idx_stockmovements_item ON StockMovements(item_type, item_id);
CREATE INDEX idx_customers_name ON Customers(customer_name);
CREATE INDEX idx_salesorders_customer ON SalesOrders(customer_id);
CREATE INDEX idx_salesorders_salesrep ON SalesOrders(sales_rep_id);

