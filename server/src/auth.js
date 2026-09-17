import jwt from 'jsonwebtoken';
const secret = process.env.JWT_SECRET || 'development-secret';
export function signToken(user) { return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '7d' }); }
export function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    req.auth = jwt.verify(token, secret); next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' }); }
}
export function requireTeacher(req, res, next) { if (req.auth.role !== 'teacher') return res.status(403).json({ message: 'Teacher access required' }); next(); }
