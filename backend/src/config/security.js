// backend/src/config/security.js
const securityConfig = {
  rateLimiting: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  csrf: {
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  }
};

module.exports = securityConfig;