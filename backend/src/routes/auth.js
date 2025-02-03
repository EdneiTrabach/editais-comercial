// backend/src/routes/auth.js
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db/index.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou senha inválidos' })
    }

    const user = result.rows[0]

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou senha inválidos' })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

export default router