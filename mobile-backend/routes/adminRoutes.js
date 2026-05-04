const express = require('express');
const router = express.Router();
const { getAllUsers, getDashboardStats, updateAccessRequest, updateUserRole, deleteUser } = require('../controllers/adminController');

router.get('/users', getAllUsers);
router.get('/stats', getDashboardStats);
router.put('/access-requests/:id', updateAccessRequest);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
