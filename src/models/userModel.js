// src/models/userModel.js
import pool from "../config/db.js";

export const getAllUsers = async () => {
  const result = await pool.query(`
    SELECT 
      u.id, u.name, u.username, u.national_id, u.dob, u.contact_info,
      u.job_title, u.department_id, u.role_id, u.created_at,
      r.role_name, d.name AS department_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON u.department_id = d.id
  `);
  return result.rows;
};

export const getUserById = async (id) => {
  const result = await pool.query(
    `
    SELECT 
      u.id, u.name, u.username, u.national_id, u.dob, u.contact_info,
      u.job_title, u.department_id, u.role_id,
      r.role_name, d.name AS department_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = $1
  `,
    [id]
  );
  return result.rows[0];
};

export const getUserByUsername = async (username) => {
  const result = await pool.query(
    `
    SELECT 
      u.*, r.role_name, d.name AS department_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.username = $1
  `,
    [username]
  );
  return result.rows[0];
};

export const createUser = async (
  name,
  username,
  hashedPassword,
  role_id,
  national_id = null,
  dob = null,
  contact_info = null,
  job_title = null,
  department_id = null
) => {
  const result = await pool.query(
    `INSERT INTO users 
      (name, username, password, role_id, national_id, dob, contact_info, job_title, department_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
    [
      name,
      username,
      hashedPassword,
      role_id,
      national_id,
      dob,
      contact_info,
      job_title,
      department_id,
    ]
  );
  return result.rows[0];
};
