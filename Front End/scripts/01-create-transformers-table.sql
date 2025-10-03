-- Create transformers table
CREATE TABLE IF NOT EXISTS transformers (
    id SERIAL PRIMARY KEY,
    transformer_no VARCHAR(50) UNIQUE NOT NULL,
    pole_no VARCHAR(50) NOT NULL,
    region VARCHAR(100) NOT NULL,
    location_details TEXT,
    type VARCHAR(50) NOT NULL,
    capacity DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO transformers (transformer_no, pole_no, region, location_details, type, capacity) VALUES
('AZ-8890', 'EN-122-A', 'Nugegoda', 'Keels, Embuldeniya', 'Bulk', 102.97),
('AZ-1949', 'EN-122-A', 'Nugegoda', 'Main Road Junction', 'Bulk', 150.00),
('AZ-7310', 'EN-122-B', 'Nugegoda', 'Commercial Area', 'Bulk', 200.00),
('AZ-4613', 'EN-122-B', 'Nugegoda', 'Residential Zone', 'Bulk', 100.00),
('AX-8993', 'EN-122-A', 'Nugegoda', 'Industrial Area', 'Distribution', 75.50),
('AY-8790', 'EN-122-B', 'Nugegoda', 'School Zone', 'Distribution', 80.00),
('AZ-4563', 'EN-123-A', 'Maharagama', 'Hospital Area', 'Bulk', 180.00),
('AZ-8523', 'EN-123-A', 'Maharagama', 'Market Square', 'Bulk', 120.00),
('AZ-6456', 'EN-123-B', 'Maharagama', 'Bus Station', 'Bulk', 160.00),
('AZ-7866', 'EN-123-B', 'Maharagama', 'Temple Road', 'Bulk', 140.00),
('AX-8990', 'EN-123-A', 'Maharagama', 'Shopping Complex', 'Distribution', 90.00);
