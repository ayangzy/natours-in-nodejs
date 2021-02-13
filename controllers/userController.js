const User = require('../models/userModel');

exports.getAllUsers = async (req, res, next) => {
  const user = await User.find();
  res.status(200).send({
    status: 'success',
    message: 'users successfully retrieved',
    data: {
      users: user,
    },
  });
};
