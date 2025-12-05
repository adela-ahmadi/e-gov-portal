// src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
  const { name, username, password, role_id } = req.body;
  if (!name || !username || !password) {
    return res.render("auth/register", { error: "All fields are required" });
  }
  try {
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE username=$1",
      [username]
    );
    if (userCheck.rows.length > 0) {
      return res.render("auth/register", { error: "Username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const role = role_id ? role_id : 1; // default citizen

    const inserted = await pool.query(
      `INSERT INTO users (name, username, password, role_id) 
       VALUES ($1,$2,$3,$4) 
       RETURNING id,name,username,role_id,department_id`,
      [name, username, hashed, role]
    );

    console.log("✅ User inserted into DB:", inserted.rows[0]);

    req.session.user = {
      id: inserted.rows[0].id,
      name: inserted.rows[0].name,
      username: inserted.rows[0].username,
      role_id: inserted.rows[0].role_id,
      department_id: inserted.rows[0].department_id ?? null,
    };

    return res.redirect("/login?registered=true");
  } catch (err) {
    console.error("❌ Full error:", err);
    console.error("Error code:", err.code);
    console.error("Constraint:", err.constraint);
    console.error("Column:", err.column);
    return res.render("auth/register", {
      error: "Registration failed: " + err.message,
    });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render("auth/login", {
      error: "Username and password are required",
    });
  }
  try {
    const result = await pool.query(
      `SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id=r.id WHERE u.username=$1`,
      [username]
    );
    const user = result.rows[0];
    if (!user)
      return res.render("auth/login", { error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.render("auth/login", { error: "Invalid credentials" });

    // create JWT (optional) and session
    const tokenPayload = {
      id: user.id,
      role_id: user.role_id,
      username: user.username,
    };
    const token = JWT_SECRET
      ? jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "2h" })
      : null;

    req.session.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      role_id: user.role_id,
      department_id: user.department_id ?? null,
    };

    // If client expects JSON (API), return token; else redirect to dashboard
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json({ message: "Login successful", token });
    }

    // redirect by role_id: (1) citizen, (2) officer, (3) dept head?, (4) admin
    if (user.role_id === 1) return res.redirect("/citizen/dashboard");
    if (user.role_id === 2) return res.redirect("/officer/dashboard");
    if (user.role_id === 4) return res.redirect("/admin/dashboard");
    return res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    return res.render("auth/login", { error: "Server error during login" });
  }
};

export const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
};
