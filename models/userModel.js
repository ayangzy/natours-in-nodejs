//const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = Schema({
  name: {
    type: String,
    required: [true, 'The name field cannot be empty'],
  },
  email: {
    type: String,
    required: [true, 'The email field cannot be empty'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Please provide your password'],
    minlength: 5,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //this only work on create and save
      validator: function (el) {
        return el === this.password;
      },
      message: 'password does not match',
    },
  },
  photo: String,
});

userSchema.pre('save', async function (next) {
  //only run this function if the password was actually modified
  if (!this.isModified('password')) return next();

  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //delete the confirm password field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = model('User', userSchema);

module.exports = User;
