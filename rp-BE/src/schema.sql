-- -- create database in psql first:
-- -- CREATE DATABASE return_point;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL, -- 'found' or 'lost'
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  date TIMESTAMP,
  description TEXT,
  status VARCHAR(20) DEFAULT 'dicari' CHECK (status IN ('dicari', 'ditemukan', 'diclaim')),
  contact VARCHAR(100),
  photo TEXT, -- store path or URL
  reporter VARCHAR(100),
  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO items (type, name, location, date, description, contact, photo, reporter)
VALUES
('found','Black Wallet','Library', now() - interval '2 days', 'Black leather wallet', '081100111', '/uploads/example1.jpg', 'alice'),
('lost','Silver Watch','Cafeteria', now() - interval '5 days', 'Analog watch with scratches', '081122233', '/uploads/example2.jpg', 'bob');

-- -- indexes
-- CREATE INDEX idx_items_type_created ON items(type, created_at DESC);
