// src/controllers/reportController.js
import pool from "../config/db.js";

export const getReports = async (req, res) => {
  try {
    // requests per department + approved/rejected counts
    const stats = await pool.query(`
      SELECT d.name AS department,
        COUNT(r.id) FILTER (WHERE r.id IS NOT NULL) AS total_requests,
        SUM(CASE WHEN r.status='Approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN r.status='Rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(p.amount) AS total_revenue
      FROM departments d
      LEFT JOIN services s ON s.department_id = d.id
      LEFT JOIN requests r ON r.service_id = s.id
      LEFT JOIN payments p ON p.request_id = r.id
      GROUP BY d.name
      ORDER BY d.name
    `);
    // support both JSON and rendered view
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json(stats.rows);
    }
    return res.render("admin/reports", {
      stats: stats.rows,
      user: req.session.user,
    });
  } catch (err) {
    console.error("getReports error:", err);
    return res.status(500).send("Server error");
  }
};
