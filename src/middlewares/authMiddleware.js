// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken'

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'thisIsAStrongSecretKeyThatShouldBeLongAndRandom123!@'

export const authMiddleware = (req, res, next) => {
  // 1) اگر session موجود بود (EJS / browser) => از session استفاده کن
  if (req.session && req.session.user) {
    req.user = req.session.user // { id, username, role_id || role }
    return next()
  }

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded // decoded should include id, role_id (or role)
      return next()
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token.' })
    }
  }

  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.redirect('/login')
  }
  return res.status(401).json({ message: 'Access denied. Please log in.' })
}
