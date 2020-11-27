const jwt = require('jsonwebtoken');
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
