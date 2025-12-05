// src/controllers/servicesController.js
import pool from "../config/db.js";

export const getServices = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name, s.description, s.fee, s.department_id, d.name AS department_name
      FROM services s
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY s.id ASC
    `);
    // If API requested JSON
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json(result.rows);
    }
    return res.render("citizen/services", {
      services: result.rows,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Get services error:", err);
    return res.status(500).send("Server error");
  }
};

export const getServicesByDept = async (req, res) => {
  const { department } = req.query;
  if (!department) return res.status(400).send("Department is required");
  try {
    const result = await pool.query(
      `
      SELECT s.id, s.name, s.description, s.fee, d.name AS department_name
      FROM services s
      JOIN departments d ON s.department_id = d.id
      WHERE d.id = $1 OR d.name = $2
      ORDER BY s.id ASC
    `,
      [department, department]
    );
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json(result.rows);
    }
    return res.render("citizen/services", {
      services: result.rows,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Get services by dept error:", err);
    return res.status(500).send("Server error");
  }
};
