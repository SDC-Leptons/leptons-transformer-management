-- Create thermal images table
CREATE TABLE IF NOT EXISTS thermal_images (
    id SERIAL PRIMARY KEY,
    transformer_id INTEGER REFERENCES transformers(id) ON DELETE CASCADE,
    inspection_id INTEGER REFERENCES inspections(id) ON DELETE CASCADE,
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('baseline', 'maintenance')),
    image_url VARCHAR(500) NOT NULL,
    environmental_condition VARCHAR(20) CHECK (environmental_condition IN ('sunny', 'cloudy', 'rainy')),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploader_name VARCHAR(100),
    file_size INTEGER,
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transformers_transformer_no ON transformers(transformer_no);
CREATE INDEX IF NOT EXISTS idx_transformers_region ON transformers(region);
CREATE INDEX IF NOT EXISTS idx_inspections_transformer_id ON inspections(transformer_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_thermal_images_transformer_id ON thermal_images(transformer_id);
CREATE INDEX IF NOT EXISTS idx_thermal_images_inspection_id ON thermal_images(inspection_id);
