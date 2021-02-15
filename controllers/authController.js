const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ),
  httpOnly: true,
};

if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, cookieOptions);
  //This remove password from the output
  user.password = undefined;

  res.status(statusCode).send({
    status: 'success',
    message: 'successfully created',
    token,
    data: {
      user: user,
    },
  });
};
exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
    createSendToken(newUser, 201, res);
  } catch (error) {
    res.status(500).send({
      status: 'fail',
      message: error,
    });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      status: 'fail',
      message: 'Please provide a username and password',
    });
  }

  //check if user exist and password is actually correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).send({
      status: 'fail',
      message: 'Incorrect email or password',
    });
  }

  createSendToken(user, 200, res);
};

exports.protect = async (req, res, next) => {
  try {
    //getting token and check if it exist
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).send({
        status: 'fail',
        message: 'You are not logged in, please login to gain access',
      });
    }

    //verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //check if user still exist
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).send({
        status: 'fail',
        message: 'The user belonging to this token no longer exist',
      });
    }
    //check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.ait)) {
      return res.status(401).send({
        status: 'fail',
        message: 'User recently changed password, please login again',
      });
    }

    req.user = currentUser;
  } catch (error) {
    res.status(500).send({
      status: 'fail',
      message: error,
    });
  }
  //Grant access to the protected route

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.body.role)) {
      return res.status(403).send({
        status: 'fail',
        message: 'You do not have the permission to perform this operation',
      });
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).send({
      status: 'fail',
      message: 'there is no user with that email address',
    });
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? submit a PATCH request with your new password and confirmed password to ${resetUrl}. \nIf u didn't forgot your password please ignore this email`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token. valid for just 10 minutes',
      message,
    });
    res.status(200).send({
      status: 'Success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).send({
      status: 'fail',
      message: 'there was an error sending email, please try again later',
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).send({
        status: 'fail',
        message: 'Token is invalid or has expired',
      });
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    return res.status(500).status({
      status: 'fail',
      message:
        'An error occur while trying to perform action, please try again',
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return res.status(401).send({
        status: 'fails',
        message: 'Your current password is wrong',
      });
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    return res.status(400).send({
      status: 'fail',
      message: 'Bad request',
    });
  }
};
