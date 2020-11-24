const User = require('../models/userModel');

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);
    if (!newUser) {
      return res.status(400).send({
        status: 'fail',
        message: 'Bad request',
      });
    }
    res.status(201).send({
      status: 'success',
      message: 'successfully created',
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
