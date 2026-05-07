const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret_change_me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Name, email, and password are required');
    }
    if (!validateEmail(email)) {
      res.status(400);
      throw new Error('A valid email address is required');
    }
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      throw new Error('Email is already registered');
    }

    const user = await User.create({ name, email, password });
    res.status(201).json({ user: publicUser(user), token: createToken(user._id) });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({ user: publicUser(user), token: createToken(user._id) });
  } catch (error) {
    next(error);
  }
};

const profile = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email || !validateEmail(email)) {
      res.status(400);
      throw new Error('A valid name and email are required');
    }

    const emailTaken = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (emailTaken) {
      res.status(409);
      throw new Error('Email is already in use');
    }

    const user = await User.findById(req.user._id);
    user.name = name;
    user.email = email;
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400);
      throw new Error('Current password and a new password of at least 6 characters are required');
    }

    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, profile, updateProfile, changePassword };
