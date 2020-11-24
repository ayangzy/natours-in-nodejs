const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signUp', authController.signUp);

router.route('/').get(userController.getAllUsers);

module.exports = router;
