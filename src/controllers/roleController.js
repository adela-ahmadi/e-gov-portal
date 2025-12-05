// src/controllers/roleController.js
import pool from "../config/db.js";

export const getRoles = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, role_name FROM roles ORDER BY id"
    );
    return res.json(rows);
  } catch (err) {
    console.error("getRoles error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
