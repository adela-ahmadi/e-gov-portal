//  server.js — E-Gov Portal (Updated & Fixed)

import 'dotenv/config'
import pool from './config/db.js'
import multer from 'multer'
import express from 'express'
import session from 'express-session'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')
const upload = multer({ dest: path.join(rootDir, 'uploads/documents') })
const app = express()

//  Static + Views
app.use(express.static(path.join(rootDir, 'public')))
app.set('view engine', 'ejs')
app.set('views', path.resolve(__dirname, '../views'))

//  Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
  })
)

//  Home Page
app.get('/', (req, res) => {
  const user = req.session?.user || null
  res.render('home', { user })
})

// Login Page
app.get('/login', (req, res) => {
  res.render('auth/login', { error: null })
})

//  Login User
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [
      username
    ])
    const user = result.rows[0]

    if (!user) return res.render('auth/login', { error: 'Invalid credentials' })

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid)
      return res.render('auth/login', { error: 'Invalid credentials' })

    req.session.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      role_id: user.role_id,
      department_id: user.department_id
    }

    if (user.role_id === 1) return res.redirect('/citizen/dashboard')
    if (user.role_id === 2) return res.redirect('/officer/dashboard')
    if (user.role_id === 4) return res.redirect('/admin/dashboard')

    return res.redirect('/login')
  } catch (err) {
    console.error('Login error:', err)
    res.render('auth/login', { error: 'Server error' })
  }
})

//  Register Page
app.get('/register', (req, res) => {
  res.render('auth/register', { error: null })
})

//  Process Registration
app.post('/api/auth/register', async (req, res) => {
  const { name, username, password, role_id, department_id } = req.body
  console.log('📩 Received from frontend:', req.body)

  try {
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    )
    if (userCheck.rows.length > 0) {
      return res.render('auth/register', { error: 'Username already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    let finalDepartmentId = null

    if (role_id == 2) {
      if (!department_id || department_id === '') {
        return res.render('auth/register', {
          error: 'Department is required for officers'
        })
      }
      finalDepartmentId = department_id
    }

    await pool.query(
      `INSERT INTO users (name, username, password, role_id, department_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, username, role_id, department_id`,
      [name, username, hashedPassword, role_id || 1, finalDepartmentId]
    )

    res.redirect('/login?registered=true')
  } catch (err) {
    console.error('Registration error:', err)
    res.render('auth/register', { error: 'Registration failed' })
  }
})
// Citizen Dashboard
app.get('/citizen/dashboard', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 1) return res.redirect('/login')

  try {
    const result = await pool.query(
      `SELECT r.id, s.name AS service_name, r.status, r.created_at 
       FROM requests r
       LEFT JOIN services s ON r.service_id = s.id
       WHERE r.citizen_id = $1
       ORDER BY r.created_at DESC`,
      [user.id]
    )

    //  Notifications
    const notifications = await pool.query(
      'SELECT message, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3',
      [user.id]
    )

    res.render('citizen/dashboard', {
      user,
      requests: result.rows,
      notifications: notifications.rows
    })
  } catch (err) {
    console.error('Citizen Dashboard Error:', err)
    res.render('citizen/dashboard', {
      user,
      requests: [],
      notifications: [],
      error: 'DB error'
    })
  }
})

//  Apply Service Page
app.get('/citizen/apply-service', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 1) return res.redirect('/login')
  try {
    const result = await pool.query('SELECT id, name FROM services')
    res.render('citizen/applyService', { user, services: result.rows })
  } catch (err) {
    console.error('Load services error:', err)
    res.render('citizen/applyService', {
      user,
      services: [],
      error: 'Failed to load services'
    })
  }
})

//  Send New Service Request
app.post(
  '/citizen/apply-service',
  upload.fields([
    { name: 'passport_copy', maxCount: 1 },
    { name: 'tazkira_copy', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]),
  async (req, res) => {
    const user = req.session.user
    if (!user || user.role_id !== 1) return res.redirect('/login')

    const { service_id } = req.body
    try {
      const svc = await pool.query(
        'SELECT id, fee FROM services WHERE id = $1',
        [service_id]
      )
      if (svc.rows.length === 0) {
        return res.status(400).send('Service not found')
      }
      const serviceId = svc.rows[0].id
      const fee = svc.rows[0].fee || 0

      // Saving Request
      const result = await pool.query(
        `INSERT INTO requests (citizen_id, service_id, status, created_at, updated_at)
         VALUES ($1, $2, 'Submitted', NOW(), NOW()) RETURNING id`,
        [user.id, serviceId]
      )

      // Saving Files
      if (req.files) {
        for (const field of Object.keys(req.files)) {
          for (const file of req.files[field]) {
            await pool.query(
              `INSERT INTO documents (request_id, file_path, file_type)
               VALUES ($1, $2, $3)`,
              [result.rows[0].id, `/uploads/${file.filename}`, file.mimetype]
            )
          }
        }
      }

      // Saving Payment (Simulated)
      await pool.query(
        `INSERT INTO payments (request_id, amount, status, payment_method)
         VALUES ($1, $2, $3, 'Simulated')`,
        [result.rows[0].id, fee, fee > 0 ? 'Pending' : 'Paid']
      )

      // Notification
      await pool.query(
        `INSERT INTO notifications (user_id, message, is_read)
         VALUES ($1, $2, false)`,
        [user.id, `Your request #${result.rows[0].id} has been submitted.`]
      )

      res.redirect('/citizen/requests')
    } catch (err) {
      console.error('Apply service error:', err)
      res.status(500).send('Error submitting request')
    }
  }
)

//  Citizen Requests List
app.get('/citizen/requests', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 1) return res.redirect('/login')

  try {
    const result = await pool.query(
      `SELECT r.id, s.name AS service_name, r.status, r.created_at AS submitted_at
       FROM requests r
       LEFT JOIN services s ON r.service_id = s.id
       WHERE r.citizen_id = $1
       ORDER BY r.created_at DESC`,
      [user.id]
    )
    res.render('citizen/myRequests', { user, requests: result.rows })
  } catch (err) {
    console.error('Citizen Requests Error:', err)
    res.render('citizen/myRequests', { user, requests: [], error: 'DB error' })
  }
})

//  Officer Dashboard
app.get('/officer/dashboard', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 2) return res.redirect('/login')

  if (!user.department_id) {
    return res
      .status(500)
      .send('Your account is not assigned to any department.')
  }

  try {
    const result = await pool.query(
      `SELECT r.*, u.name as citizen_name, s.name AS service_name
       FROM requests r
       JOIN users u ON r.citizen_id = u.id
       JOIN services s ON r.service_id = s.id
       WHERE r.status IN ('Submitted', 'Under Review', 'More Info Required')
         AND s.department_id = $1
       ORDER BY r.created_at DESC`,
      [user.department_id]
    )
    res.render('officer/dashboard', {
      user,
      requests: result.rows,
      query: req.query || {}
    })
  } catch (err) {
    console.error('Officer Dashboard Error:', err)
    res.render('officer/dashboard', {
      user,
      requests: [],
      query: req.query || {}
    })
  }
})

app.get('/officer/request/:id', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 2) return res.redirect('/login')

  const requestId = req.params.id
  try {
    //  Change status to "Under Review"
    await pool.query(
      "UPDATE requests SET status = 'Under Review' WHERE id = $1 AND status = 'Submitted'",
      [requestId]
    )

    const reqResult = await pool.query(
      `SELECT r.id, r.status, r.created_at AS submitted_at,
              s.name AS service_name, u.name AS citizen_name
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN users u ON r.citizen_id = u.id
       WHERE r.id = $1 AND s.department_id = $2`,
      [requestId, user.department_id]
    )

    if (reqResult.rows.length === 0) {
      return res.status(404).send('Request not found')
    }

    const docResult = await pool.query(
      'SELECT file_path, file_type FROM documents WHERE request_id = $1',
      [requestId]
    )

    res.render('officer/reviewRequest', {
      user,
      request: reqResult.rows[0],
      documents: docResult.rows
    })
  } catch (err) {
    console.error('Officer review error:', err)
    res.status(500).send('Error loading request')
  }
})

// Update Request Status + Notification
app.post('/officer/request/:id/update', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 2) return res.redirect('/login')

  const { status } = req.body
  const requestId = req.params.id

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).send('Invalid status')
  }

  try {
    //  Get citizen_id first
    const reqData = await pool.query(
      'SELECT citizen_id FROM requests WHERE id = $1',
      [requestId]
    )
    if (reqData.rows.length === 0) {
      return res.status(404).send('Request not found')
    }
    const citizenId = reqData.rows[0].citizen_id

    //  Update status and reviewed_by
    await pool.query(
      'UPDATE requests SET status = $1, reviewed_by = $2, updated_at = NOW() WHERE id = $3',
      [status, user.id, requestId]
    )

    //  Notification for citizen
    await pool.query(
      `INSERT INTO notifications (user_id, message, is_read)
       VALUES ($1, $2, false)`,
      [
        citizenId,
        `Your request #${requestId} has been ${status.toLowerCase()}.`
      ]
    )

    res.redirect('/officer/dashboard')
  } catch (err) {
    console.error('Update request error:', err)
    res.status(500).send('Failed to update request')
  }
})
//  Officer Reports
app.get('/officer/reports', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 2) return res.redirect('/login')

  try {
    //  Total requests reviewed by this officer
    const reviewed = await pool.query(
      'SELECT COUNT(*)::int AS total FROM requests WHERE reviewed_by = $1',
      [user.id]
    )

    //  Average processing time (simplified: number of days from first request)
    const avgTime = await pool.query(
      `SELECT 
        COALESCE(AVG(EXTRACT(DAY FROM (updated_at - created_at))), 0)::int AS avg_days
       FROM requests 
       WHERE reviewed_by = $1 AND updated_at IS NOT NULL`,
      [user.id]
    )

    //  SLA Compliance:
    const sla = await pool.query(
      `SELECT 
        COALESCE(
          (COUNT(*) FILTER (WHERE status = 'Approved') * 100 / NULLIF(COUNT(*), 0)), 
          0
        )::int AS compliance
       FROM requests 
       WHERE reviewed_by = $1`,
      [user.id]
    )

    //  Pending Requests
    const pending = await pool.query(
      "SELECT COUNT(*)::int AS pending FROM requests WHERE reviewed_by = $1 AND status = 'Under Review'",
      [user.id]
    )

    //  Recent Activities
    const recent = await pool.query(
      `SELECT r.id, s.name AS service_name, r.status, r.created_at
       FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE r.reviewed_by = $1
       ORDER BY r.updated_at DESC
       LIMIT 5`,
      [user.id]
    )

    res.render('officer/reports', {
      user,
      stats: {
        reviewed: reviewed.rows[0].total,
        avgTime: avgTime.rows[0].avg_days,
        compliance: sla.rows[0].compliance,
        pending: pending.rows[0].pending
      },
      recentRequests: recent.rows
    })
  } catch (err) {
    console.error('Officer reports error:', err)
    res.status(500).send('Error loading reports')
  }
})

//  Admin Routes
app.get('/admin/dashboard', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 4) return res.redirect('/login')

  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE status = 'Approved')::int AS approved,
        COUNT(*) FILTER (WHERE status = 'Rejected')::int AS rejected,
        COALESCE(SUM(s.fee), 0)::int AS total_revenue
      FROM requests r
      LEFT JOIN services s ON r.service_id = s.id
    `)

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
    `)

    const recentRequests = await pool.query(`
      SELECT r.id, s.name AS service_name, r.status, r.created_at, u.name AS citizen_name
      FROM requests r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON r.citizen_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `)

    res.render('admin/dashboard', {
      user,
      stats: stats.rows[0],
      deptStats: deptStats.rows,
      recentRequests: recentRequests.rows
    })
  } catch (err) {
    console.error('Admin dashboard error:', err)
    res.status(500).send('Error loading admin dashboard')
  }
})

app.get('/admin/reports', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 4) return res.redirect('/login')

  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE status = 'Approved')::int AS approved,
        COUNT(*) FILTER (WHERE status = 'Rejected')::int AS rejected,
        COALESCE(SUM(s.fee), 0)::int AS total_revenue
      FROM requests r
      LEFT JOIN services s ON r.service_id = s.id
    `)

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
    `)

    res.render('admin/reports', {
      user,
      stats: stats.rows[0],
      deptStats: deptStats.rows
    })
  } catch (err) {
    console.error('Admin reports error:', err)
    res.status(500).send('Error loading reports')
  }
})

app.get('/admin/users', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 4) return res.redirect('/login')

  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.username, u.role_id, r.role_name, u.department_id, d.name AS department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.id
    `)
    res.render('admin/manageUsers', {
      users: result.rows,
      user,
      query: req.query
    })
  } catch (err) {
    console.error('Manage users error:', err)
    res.status(500).send('Error loading users')
  }
})

app.get('/admin/services', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 4) return res.redirect('/login')

  try {
    const services = await pool.query(`
      SELECT s.id, s.name, s.fee, d.name AS department_name
      FROM services s
      JOIN departments d ON s.department_id = d.id
      ORDER BY s.id
    `)
    const departments = await pool.query('SELECT id, name FROM departments')
    res.render('admin/manageServices', {
      user,
      services: services.rows,
      departments: departments.rows
    })
  } catch (err) {
    console.error('Manage services error:', err)
    res.status(500).send('Error loading services')
  }
})

app.post('/admin/services/add', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 4) return res.redirect('/login')

  const { name, department_id, fee } = req.body
  try {
    await pool.query(
      `INSERT INTO services (name, department_id, fee) VALUES ($1, $2, $3)`,
      [name, department_id, parseInt(fee) || 0]
    )
    res.redirect('/admin/services')
  } catch (err) {
    console.error('Add service error:', err)
    res.status(500).send('Failed to add service')
  }
})
// Delete User (Admin Only)

app.post('/admin/users/:id/delete', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 4) return res.redirect('/login')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const userId = req.params.id

    // Delete Notifications
    await client.query('DELETE FROM notifications WHERE user_id = $1', [userId])

    // Delete Payments
    await client.query(
      `
      DELETE FROM payments
      WHERE request_id IN (
        SELECT id FROM requests WHERE citizen_id = $1
      )
    `,
      [userId]
    )

    // Delete Documents
    await client.query(
      `
      DELETE FROM documents
      WHERE request_id IN (
        SELECT id FROM requests WHERE citizen_id = $1
      )
    `,
      [userId]
    )

    // Delete Requests
    await client.query('DELETE FROM requests WHERE citizen_id = $1', [userId])

    // Delete User
    await client.query('DELETE FROM users WHERE id = $1', [userId])

    await client.query('COMMIT')
    res.redirect('/admin/users')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Delete user error:', err)
    res.status(500).send('Failed to delete user')
  } finally {
    client.release()
  }
})

// Delete Service (Admin Only)
app.post('/admin/services/:id/delete', async (req, res) => {
  const user = req.session.user
  if (!user || user.role_id !== 4) return res.redirect('/login')

  try {
    await pool.query('DELETE FROM services WHERE id = $1', [req.params.id])
    res.redirect('/admin/services')
  } catch (err) {
    console.error('Delete service error:', err)
    res.status(500).send('Failed to delete service')
  }
})

//  Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout failed')
    }
    res.clearCookie('connect.sid')
    res.redirect('/')
  })
})
//  404
app.use((req, res) => {
  res.status(404).render('partials/404', { title: 'Page Not Found' })
})

// Server start
const PORT = process.env.PORT || 5000
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
)
//  End of server.js
