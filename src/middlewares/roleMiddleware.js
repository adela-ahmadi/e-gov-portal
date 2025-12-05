// src/middlewares/roleMiddleware.js
export const requireRole =
  (allowedRoles = []) =>
  (req, res, next) => {
    const user = req.user || req.session?.user
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const roleId = user.role_id ?? user.role_id // keep if present
    const role = user.role ?? user.role_name ?? null

    const allowed = allowedRoles.map((r) => String(r))

    if (roleId && allowed.includes(String(roleId))) return next()
    if (role && allowed.includes(String(role))) return next()

    return res
      .status(403)
      .json({ message: 'Forbidden: insufficient permissions' })
  }
