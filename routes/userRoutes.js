const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signUp', authController.signUp);
router.post('/login', authController.login);
router.post('/forgotPassowrd', authController.forgotPassowrd);
router.post('/resetPassword', authController.resetPassword);

router.route('/').get(userController.getAllUsers);

module.exports = router;
