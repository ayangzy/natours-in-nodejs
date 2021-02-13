const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
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
    const token = signToken(newUser._id);

    if (!newUser) {
      return res.status(400).send({
        status: 'fail',
        message: 'Bad request',
      });
    }
    res.status(201).send({
      status: 'success',
      message: 'successfully created',
      token,
      data: {
        user: newUser,
      },
    });
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

  const token = signToken(user._id);
  return res.status(200).send({
    status: 'success',
    message: 'successfully logged in',
    token,
    data: {
      name: user.name,
      email: user.email,
    },
  });
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
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send({
        status: 'fail',
        message: 'there is no user with that email address',
      });
    }
    const resetToken = user.createPasswordResetToken();
    await user.save();
  } catch (error) {
    res.status(500).send({
      status: 'fail',
      message: 'something went wrong while trying to perform this operation',
    });
  }
};

exports.resetPassword = async (req, res, next) => {};
