// ==== routes/person.js ====
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { searchPersons, getPersonsList, approveUpdate, updatePersonInfo, createPersonInfo, approveProfile, viewAccessUserProfile, rejectUpdate } = require('../controllers/personController');

// Create person info (Admin or Operator)
router.post('/createPerson', verifyToken, checkRole(['R1', 'R2']), createPersonInfo);

// Approve person info (Admin only)
router.patch('/approveProfile', verifyToken, checkRole(['R1']), approveProfile);

// Update person info (All roles)
router.put('/update', verifyToken, checkRole(['R1', 'R2', 'R3']), updatePersonInfo);

// update Approve person info (Admin only)
router.patch('/approveUpdate', verifyToken, checkRole(['R1']), approveUpdate);

// Reject person info update (Admin only)
router.patch('/rejectUpdate', verifyToken, checkRole(['R1']), rejectUpdate);

// Get person(s)
router.get('/getList', verifyToken, getPersonsList);

// Search person
router.get('/search', verifyToken, checkRole(['R1', 'R2']), searchPersons);

// View access user profile
router.get('/viewProfile', verifyToken, checkRole(['R3']), viewAccessUserProfile);

module.exports = router;