// src/controllers/userController.js
import pool from "../config/db.js";

export const fetchUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.username, u.role_id, r.role_name, d.name AS department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id=r.id
      LEFT JOIN departments d ON u.department_id=d.id
      ORDER BY u.id
    `);
    // remove password fields (we didn't select them)
    return res.json(result.rows);
  } catch (err) {
    console.error("fetchUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const fetchUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT u.id, u.name, u.username, u.national_id, u.dob, u.contact_info, u.job_title,
             u.role_id, r.role_name, u.department_id, d.name AS department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("fetchUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
