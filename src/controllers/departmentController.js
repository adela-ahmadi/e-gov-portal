// src/controllers/departmentController.js
import pool from "../config/db.js";

export const getDepartments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name FROM departments ORDER BY id"
    );
    if (req.headers.accept && req.headers.accept.includes("application/json"))
      return res.json(rows);
    return res.render("partials/departments", {
      departments: rows,
      user: req.session.user,
    });
  } catch (err) {
    console.error("getDepartments error:", err);
    return res.status(500).send("Server error");
  }
};
