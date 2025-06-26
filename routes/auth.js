// ==== routes/auth.js ====
const express = require('express');
const router = express.Router();
const { createRole, createUser, loginUser } = require('../controllers/authController');

router.post('/roles', createRole);

router.post('/users', createUser);

router.post('/login', loginUser);

module.exports = router;