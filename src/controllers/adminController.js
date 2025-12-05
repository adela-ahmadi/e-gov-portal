import pool from "../config/db.js";

export const getAdminDashboard = async (req, res) => {
  const user = req.session.user;
  if (!user || user.role_id !== 4) return res.redirect("/login");
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE status = 'Approved')::int AS approved,
        COUNT(*) FILTER (WHERE status = 'Rejected')::int AS rejected,
        COALESCE(SUM(s.fee), 0)::int AS total_revenue
      FROM requests r
      LEFT JOIN services s ON r.service_id = s.id
    `);

    const deptStats = await pool.query(`
      SELECT 
        d.name AS department,
        COUNT(r.id) AS request_count,
        COUNT(r.id) FILTER (WHERE r.status = 'Approved') AS approved,
        COUNT(r.id) FILTER (WHERE r.status = 'Rejected') AS rejected
      FROM departments d
      LEFT JOIN services s ON d.id = s.department_id
      LEFT JOIN requests r ON s.id = r.service_id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);

    const recentRequests = await pool.query(`
      SELECT r.id, s.name AS service_name, r.status, r.created_at
      FROM requests r
      JOIN services s ON r.service_id = s.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    res.render("admin/dashboard", {
      user,
      stats: stats.rows[0],
      deptStats: deptStats.rows,
      recentRequests: recentRequests.rows,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).send("Error loading admin dashboard");
  }
};

export const getAdminReports = async (req, res) => {
  const user = req.session.user;
  if (!user || user.role_id !== 4) return res.redirect("/login");
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE status = 'Approved')::int AS approved,
        COUNT(*) FILTER (WHERE status = 'Rejected')::int AS rejected,
        COALESCE(SUM(s.fee), 0)::int AS total_revenue
      FROM requests r
      LEFT JOIN services s ON r.service_id = s.id
    `);

    const deptStats = await pool.query(`
      SELECT 
        d.name AS department,
        COUNT(r.id) AS request_count,
        COUNT(r.id) FILTER (WHERE r.status = 'Approved') AS approved,
        COUNT(r.id) FILTER (WHERE r.status = 'Rejected') AS rejected
      FROM departments d
      LEFT JOIN services s ON d.id = s.department_id
      LEFT JOIN requests r ON s.id = r.service_id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);

    res.render("admin/reports", {
      user,
      stats: stats.rows[0],
      deptStats: deptStats.rows,
    });
  } catch (err) {
    console.error("Admin reports error:", err);
    res.status(500).send("Error loading reports");
  }
};

export const getAllUsers = async (req, res) => {
  const user = req.session.user;
  if (!user || user.role_id !== 4) return res.redirect("/login");
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.username, u.role_id, r.role_name, u.department_id, d.name AS department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.id
    `);
    res.render("admin/manageUsers", {
      users: result.rows,
      user,
      query: req.query,
    });
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).send("Server error");
  }
};

export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role_id } = req.body;
  if (!role_id) return res.status(400).json({ message: "role_id required" });
  try {
    const updated = await pool.query(
      `UPDATE users SET role_id=$1 WHERE id=$2 RETURNING id,name,username,role_id`,
      [role_id, id]
    );
    if (updated.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    return res.json({ message: "User role updated", user: updated.rows[0] });
  } catch (err) {
    console.error("updateUserRole error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUserDepartment = async (req, res) => {
  const { id } = req.params;
  const { department_id } = req.body;
  if (department_id == null)
    return res.status(400).json({ message: "department_id is required" });
  try {
    const userCheck = await pool.query(
      "SELECT role_id FROM users WHERE id=$1",
      [id]
    );
    if (userCheck.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    const roleId = userCheck.rows[0].role_id;
    if (![2, 3].includes(roleId)) {
      return res
        .status(400)
        .json({ message: "Only officers can have department" });
    }
    const updated = await pool.query(
      `UPDATE users SET department_id=$1 WHERE id=$2 RETURNING id,name,username,department_id`,
      [department_id, id]
    );
    return res.json({
      message: "User department updated",
      user: updated.rows[0],
    });
  } catch (err) {
    console.error("updateUserDepartment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getManageServicesPage = async (req, res) => {
  const user = req.session.user;
  if (!user || user.role_id !== 4) return res.redirect("/login");
  try {
    const services = await pool.query(`
      SELECT s.id, s.name, s.fee, d.name AS department_name
      FROM services s
      JOIN departments d ON s.department_id = d.id
      ORDER BY s.id
    `);
    const departments = await pool.query("SELECT id, name FROM departments");
    res.render("admin/manageServices", {
      user,
      services: services.rows,
      departments: departments.rows,
    });
  } catch (err) {
    console.error("Manage services error:", err);
    res.status(500).send("Error loading services");
  }
};

export const addService = async (req, res) => {
  const { name, department_id, fee } = req.body;
  try {
    await pool.query(
      `INSERT INTO services (name, department_id, fee) VALUES ($1, $2, $3)`,
      [name, department_id, parseInt(fee) || 0]
    );
    res.redirect("/admin/services");
  } catch (err) {
    console.error("Add service error:", err);
    res.status(500).send("Failed to add service");
  }
};
