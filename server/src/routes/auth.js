const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone, role } = req.body;

  // Input validation
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, senha e nome completo são obrigatórios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Validate phone if provided (Angola format: +244XXXXXXXXX or 9XXXXXXXXX)
  if (phone) {
    const phoneRegex = /^(\+244|9)[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/[\s.-]/g, ''))) {
      return res.status(400).json({ error: 'Telefone inválido. Formato esperado: +2449XXXXXXXXX ou 9XXXXXXXXX' });
    }
  }

  // Normalize role: lowercase for DB enum, default to passenger
  const userRole = role ? role.toLowerCase() : 'passenger';

  try {
    // Check if user exists in profiles table
    const userCheck = await db.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    await db.query('BEGIN');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create Profile with password_hash
    const profileQuery = `
      INSERT INTO profiles (email, full_name, phone, role, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const profileRes = await db.query(profileQuery, [email, full_name, phone, userRole, hash]);
    const userId = profileRes.rows[0].id;

    await db.query('COMMIT');

    // Generate Token
    const token = jwt.sign({ id: userId, email, role: userRole }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: { id: userId, email, full_name, role: userRole }
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Register error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user credential
    const query = `
      SELECT id, email, full_name, avatar_url, role, password_hash
      FROM profiles
      WHERE email = $1
    `;
    const { rows } = await db.query(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = rows[0];

    // Check password
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role
      }
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error.message, error.stack);
    console.error('Email:', email);
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

// GET /me - returns logged-in user data
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'boleia_secret_key');
    const { rows } = await db.query('SELECT id, email, full_name, avatar_url, phone, role, verification_status FROM profiles WHERE id = $1', [decoded.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
    console.error('Error in /auth/me:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;