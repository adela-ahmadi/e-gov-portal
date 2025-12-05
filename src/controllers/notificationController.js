// src/controllers/notificationController.js
import pool from "../config/db.js";

export const getUserNotifications = async (req, res) => {
  const userId = req.session.user?.id ?? req.user?.id;
  if (!userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    const result = await pool.query(
      `SELECT id, message, is_read, created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC`,
      [userId]
    );
    if (req.headers.accept && req.headers.accept.includes("application/json"))
      return res.json(result.rows);
    return res.render("partials/notifications", {
      notifications: result.rows,
      user: req.session.user,
    });
  } catch (err) {
    console.error("getUserNotifications error:", err);
    return res.status(500).send("Server error");
  }
};
