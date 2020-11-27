const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
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
