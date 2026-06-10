-- Añadir columna expires_at a pin_requests
ALTER TABLE pin_requests ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
