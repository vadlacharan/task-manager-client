const prisma = require('../lib/prisma')

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.session_token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated. No session token.' });
    }

    const session = await prisma.session.findUnique({
      where: { id: token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired or invalid.' });
    }

    // Attach the user object to request for access in route handlers
    req.user = session.user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = isAuthenticated;
