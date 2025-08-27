-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id SERIAL PRIMARY KEY,
    inspection_no VARCHAR(50) UNIQUE NOT NULL,
    transformer_id INTEGER REFERENCES transformers(id) ON DELETE CASCADE,
    inspected_date TIMESTAMP NOT NULL,
    maintenance_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    inspector_name VARCHAR(100),
    branch VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample inspection data
INSERT INTO inspections (inspection_no, transformer_id, inspected_date, maintenance_date, status, inspector_name, branch) VALUES
('000123589', 1, '2023-07-02 19:12:00', NULL, 'In Progress', 'A-110', 'Nugegoda'),
('000123590', 2, '2023-07-01 18:22:00', NULL, 'In Progress', 'A-110', 'Nugegoda'),
('000123591', 3, '2023-06-13 12:12:00', NULL, 'Pending', 'A-110', 'Nugegoda'),
('000123592', 4, '2023-06-06 16:23:00', '2023-07-08 19:12:00', 'Completed', 'A-110', 'Nugegoda'),
('000123593', 5, '2023-07-02 19:12:00', '2023-07-08 19:12:00', 'Completed', 'A-110', 'Nugegoda'),
('000123594', 6, '2023-07-02 19:12:00', '2023-07-08 19:12:00', 'Completed', 'A-110', 'Nugegoda'),
('000123595', 7, '2023-07-02 19:12:00', '2023-07-08 19:12:00', 'Completed', 'A-110', 'Maharagama'),
('000123596', 8, '2023-07-02 19:12:00', '2023-07-08 19:12:00', 'Completed', 'A-110', 'Maharagama'),
('000123597', 9, '2023-07-02 19:12:00', '2023-07-08 19:12:00', 'Completed', 'A-110', 'Maharagama'),
('000123598', 10, '2023-07-02 19:12:00', '2023-07-08 19:12:00', 'Completed', 'A-110', 'Maharagama'),
('000123599', 11, '2023-04-25 10:12:00', '2023-07-08 19:12:00', 'Completed', 'A-110', 'Maharagama');
