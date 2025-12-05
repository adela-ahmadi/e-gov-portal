// src/controllers/requestController.js
import pool from '../config/db.js'
import upload from '../middlewares/uploadMiddleware.js'

export const createRequest = [
  upload.fields([
    { name: 'passport_copy', maxCount: 1 },
    { name: 'tazkira_copy', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]),
  async (req, res) => {
    const { service_type, service_id } = req.body
    // pick service_id if exists else try to map service_type -> id
    let svcId = service_id || null
    try {
      if (!svcId && service_type) {
        const svc = await pool.query(
          'SELECT id FROM services WHERE name = $1 LIMIT 1',
          [service_type]
        )
        if (svc.rows.length > 0) svcId = svc.rows[0].id
      }
      if (!svcId) {
        return res.status(400).send('Service ID or type is required')
      }

      const citizenId = req.session.user?.id ?? req.user?.id
      if (!citizenId) {
        return res.status(401).send('Not authenticated')
      }

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        const insertReq = await client.query(
          `INSERT INTO requests (citizen_id, service_id, status, created_at, updated_at)
           VALUES ($1,$2,'Submitted',NOW(),NOW()) RETURNING *`,
          [citizenId, svcId]
        )
        const request = insertReq.rows[0]

        // save documents if provided
        const fileRows = []
        if (req.files) {
          // multer fields produce object with arrays
          for (const fieldName of Object.keys(req.files)) {
            for (const file of req.files[fieldName]) {
              const fp = `/uploads/documents/${file.filename}`
              await client.query(
                `INSERT INTO documents (request_id, file_path, file_type) VALUES ($1,$2,$3)`,
                [request.id, fp, file.mimetype]
              )
              fileRows.push(fp)
            }
          }
        }

        // create a payment row (simulate fee fetch)
        const feeResult = await client.query(
          'SELECT fee FROM services WHERE id=$1',
          [svcId]
        )
        const fee = feeResult.rows[0]?.fee ?? 0
        await client.query(
          `INSERT INTO payments (request_id, amount, status, payment_method) VALUES ($1,$2,$3,$4)`,
          [request.id, fee, fee > 0 ? 'Pending' : 'Free', 'Simulated']
        )

        // notification for citizen
        await client.query(
          `INSERT INTO notifications (user_id, message, is_read, created_at)
           VALUES ($1,$2,false,NOW())`,
          [
            citizenId,
            `Your request (#${request.id}) for service has been submitted.`
          ]
        )

        await client.query('COMMIT')
        // For form-post we redirect to dashboard/requests page
        return res.redirect('/citizen/requests')
      } catch (err) {
        await client.query('ROLLBACK')
        console.error('applyForService transaction error:', err)
        return res.status(500).send('Server error submitting request')
      } finally {
        client.release()
      }
    } catch (err) {
      console.error('applyForService error:', err)
      return res.status(500).send('Server error')
    }
  }
]

export const getMyRequests = async (req, res) => {
  const citizenId = req.session.user?.id ?? req.user?.id
  if (!citizenId) {
    return res.status(401).redirect('/login')
  }
  try {
    const result = await pool.query(
      `SELECT r.id, s.name AS service_name, r.status, r.created_at AS submitted_at,
              COALESCE(p.status,'') AS payment_status
       FROM requests r
       JOIN services s ON r.service_id = s.id
       LEFT JOIN payments p ON r.id = p.request_id
       WHERE r.citizen_id = $1
       ORDER BY r.created_at DESC`,
      [citizenId]
    )
    return res.render('citizen/myRequests', {
      requests: result.rows,
      user: req.session.user
    })
  } catch (err) {
    console.error('Get my requests error:', err)
    return res.status(500).send('Server error')
  }
}

export const getFilteredRequests = async (req, res) => {
  const { status, dateFrom, dateTo } = req.query
  let query = 'SELECT * FROM requests WHERE 1=1'
  const values = []
  let idx = 1
  if (status) {
    query += ` AND status = $${idx++}`
    values.push(status)
  }
  if (dateFrom) {
    query += ` AND created_at >= $${idx++}`
    values.push(dateFrom)
  }
  if (dateTo) {
    query += ` AND created_at <= $${idx++}`
    values.push(dateTo)
  }
  query += ' ORDER BY created_at DESC'
  try {
    const result = await pool.query(query, values)
    return res.json(result.rows)
  } catch (err) {
    console.error('getFilteredRequests error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
}
