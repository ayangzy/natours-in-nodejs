const { Router } = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = Router();

router.post('/signUp', authController.signUp);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword', authController.resetPassword);

router.route('/').get(userController.getAllUsers);

module.exports = router;
