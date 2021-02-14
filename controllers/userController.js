const User = require('../models/userModel');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};
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

exports.updateMe = async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return res.status(400).send({
      status: 'fail',
      message:
        'This route is not for password updates. please use the update my password route',
    });
  }

  //filter out unwanted fields that are not allowed to be updated
  const filterBody = filterObj(req.body, 'email', 'name');

  //Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).send({
    status: 'success',
    user: updatedUser,
  });
};
