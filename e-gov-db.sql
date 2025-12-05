CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL
);

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  national_id VARCHAR(20),
  dob DATE,
  contact_info VARCHAR(255),
  job_title VARCHAR(100),
  role_id INT REFERENCES roles(id),
  department_id INT REFERENCES departments(id)
);

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  department_id INT REFERENCES departments(id),
  fee INT DEFAULT 0
);

CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  citizen_id INT REFERENCES users(id),
  service_id INT REFERENCES services(id),
  status VARCHAR(50) DEFAULT 'Submitted',
  reviewed_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  request_id INT REFERENCES requests(id),
  file_path VARCHAR(255),
  file_type VARCHAR(50)
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  request_id INT REFERENCES requests(id),
  amount INT,
  status VARCHAR(50),
  payment_method VARCHAR(50),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
