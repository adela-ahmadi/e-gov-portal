-- seed.sql

-- TRUNCATE TABLE users RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE services RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE requests RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE documents RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE payments RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE departments RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE roles RESTART IDENTITY CASCADE;

-- DELETE FROM notifications;
-- DELETE FROM payments;
-- DELETE FROM documents;
-- DELETE FROM requests;
-- DELETE FROM users;
-- DELETE FROM services;
-- DELETE FROM departments;
-- DELETE FROM roles;

-- roles

INSERT INTO roles (role_name) VALUES 
('Citizen'),
('Officer'),
('Department Head'),
('Admin');

-- Departments
INSERT INTO departments (name) VALUES 
('Interior'),
('Commerce'),
('Housing'),
('Health'),
('Education');

-- Services
INSERT INTO services (name, description, department_id, fee) VALUES 
-- Interior
('Passport Renewal', 'Renew your national passport', 1, 100),
('National ID Update', 'Update personal information on ID card', 1, 50),
-- Commerce
('Business License', 'Apply for new business license', 2, 250),
('Import Permit', 'Request permit for importing goods', 2, 200),
-- Housing
('Land Registration', 'Register land ownership', 3, 150),
('Building Permit', 'Request construction approval', 3, 300),
-- Health
('Medical License', 'Apply for medical practice license', 4, 400),
-- Education
('School Registration', 'Register a new educational institution', 5, 350);

-- Users
INSERT INTO users (name, username, password, role_id, department_id, national_id, dob, contact_info, job_title) VALUES 



('Admin User', 'admin', '$2a$10$8g1VGeJBqCFMdfBxr.p6w.d1lnoh0sVvu1d0RThhqDyjq6XteQD8K', 4, NULL, NULL, NULL, 'admin@egov.ir', NULL),


('Officer Ali', 'officer_alii', '$2a$10$8g1VGeJBqCFMdfBxr.p6w.d1lnoh0sVvu1d0RThhqDyjq6XteQD8K', 2, 1, '1111111111', '1980-03-10', 'ali@interior.gov.ir', 'Document Reviewer'),

('Officer Sara', 'officer_sara', '$2a$10$8g1VGeJBqCFMdfBxr.p6w.d1lnoh0sVvu1d0RThhqDyjq6XteQD8K', 2, 2, '2222222222', '1988-07-15', 'sara@commerce.gov.ir', 'License Officer'),


('Mahsa Ahmadi', 'mahsa_a', '$2a$10$8g1VGeJBqCFMdfBxr.p6w.d1lnoh0sVvu1d0RThhqDyjq6XteQD8K', 1, NULL, '1234567890', '1990-05-15', 'mahsa@example.com', NULL),

('Reza Mohammadi', 'reza_m', '$2a$10$8g1VGeJBqCFMdfBxr.p6w.d1lnoh0sVvu1d0RThhqDyjq6XteQD8K', 1, NULL, '0987654321', '1985-11-20', 'reza@example.com', NULL);

-- citizen_id=4 (mahsa_a), service_id=1 (Passport Renewal)
INSERT INTO requests (citizen_id, service_id, status, reviewed_by, created_at, updated_at) VALUES 

(4, 1, 'Submitted', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

(4, 2, 'Under Review', 2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

(5, 3, 'Approved', 3, NOW() - INTERVAL '3 days', NOW()),

(5, 4, 'Rejected', 3, NOW() - INTERVAL '4 days', NOW());


INSERT INTO documents (request_id, file_path, file_type) VALUES 
(1, '/uploads/documents/passport_old.pdf', 'pdf'),
(1, '/uploads/documents/photo.jpg', 'jpg'),
(2, '/uploads/documents/id_copy.jpg', 'jpg'),
(3, '/uploads/documents/business_plan.pdf', 'pdf'),
(4, '/uploads/documents/import_list.xlsx', 'xlsx');


INSERT INTO payments (request_id, amount, status, payment_method, paid_at) VALUES 
(1, 100, 'Paid', 'Credit Card', NOW() - INTERVAL '2 days'),
(2, 50, 'Paid', 'Online Banking', NOW() - INTERVAL '1 day'),
(3, 250, 'Paid', 'Credit Card', NOW() - INTERVAL '3 days'),
(4, 200, 'Paid', 'Credit Card', NOW() - INTERVAL '4 days');


INSERT INTO notifications (user_id, message, is_read, created_at) VALUES 

(4, 'Your passport renewal request has been submitted successfully.', TRUE, NOW() - INTERVAL '2 days'),
(4, 'Your ID update request is now under review.', FALSE, NOW() - INTERVAL '1 day'),

(5, 'Your business license request has been approved!', FALSE, NOW()),
(5, 'Your import permit request was rejected due to incomplete documents.', FALSE, NOW() - INTERVAL '4 days'),

(2, 'You have a new request to review (Passport Renewal - #1).', FALSE, NOW() - INTERVAL '2 days'),
(3, 'A new business license request is waiting for your approval.', FALSE, NOW() - INTERVAL '3 days');






