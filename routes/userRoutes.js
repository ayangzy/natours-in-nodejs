const { Router } = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = Router();

router.post('/signUp', authController.signUp);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/update-my-password',
  authController.protect,
  authController.updatePassword
);
router.patch('/update-me', authController.protect, userController.updateMe);

router.route('/').get(userController.getAllUsers);

module.exports = router;
