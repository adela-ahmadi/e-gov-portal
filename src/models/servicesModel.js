// src/models/servicesModel.js
import pool from "../config/db.js";

export const getAllServices = async () => {
  const result = await pool.query(`
    SELECT 
      s.id, 
      s.name, 
      s.description, 
      s.fee,
      s.department_id,
      d.name AS department_name
    FROM services s
    JOIN departments d ON s.department_id = d.id
    ORDER BY s.id ASC
  `);
  return result.rows;
};

export const getServicesByDepartment = async (departmentId) => {
  const result = await pool.query(
    `
    SELECT 
      s.id, 
      s.name, 
      s.description, 
      s.fee,
      d.name AS department_name
    FROM services s
    JOIN departments d ON s.department_id = d.id
    WHERE s.department_id = $1
  `,
    [departmentId]
  );
  return result.rows;
};
