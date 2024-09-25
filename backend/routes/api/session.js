// backend/routes/api/session.js
const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');
const router = express.Router();
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

// not sure if use or not vvv
const validateLogin = [
    check('credential')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('Email or username is required'),
    check('password')
      .exists({ checkFalsy: true })
      .withMessage('Password is required'),
    handleValidationErrors
  ];
// ^^^

// Log in

//!original vvv
// router.post('/', validateLogin, async (req, res, next) => {
// !^^^

router.post('/', async (req, res, next) => {
//
    const { credential, password } = req.body;

    // Error response: Body validation errors-------------------
    let errors = {}
    if(!credential && !password){
      errors.credential = "Email or username is required"
      errors.password = "Password is required"
      return res.status(400).json({
        message:"Bad Request",
        errors
      })
    }
    if(!credential){
      errors.credential = "Email or username is required"
      return res.status(400).json({
        message:"Bad Request",
        errors
      })
    }else if (!password){
      errors.password = "Password is required"
      return res.status(400).json({
        message:"Bad Request",
        errors
      })
    }
    // Ziwen ^^^---------------------------------------------

    const user = await User.unscoped().findOne({
      where: {
        [Op.or]: {
          username: credential,
          email: credential
        }
      }
    });

    // !original code vvv
    // if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
    //   const err = new Error('Login failed');
    //   err.status = 401;
    //   err.title = 'Login failed';
    //   err.errors = { credential: 'The provided credentials were invalid.' };
    //   return next(err);
    // }
    //!^^^

    // Error Response: Invalid credentials------------------------------------------------
    if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
      return res.status(401).json({
        message:"Invalid credentials"
      })
    }
    // Ziwen ^^^ -------------------------------------------------------------------------
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    await setTokenCookie(res, safeUser);

    return res.json({
      user: safeUser
    });
  }
);

// Log out
router.delete(
    '/',
    (_req, res) => {
      res.clearCookie('token');
      return res.json({ message: 'success' });
    }
  );
// Restore session user
router.get(
    '/',
    (req, res) => {
      const { user } = req;
      if (user) {
        const safeUser = {
          id: user.id,
          email: user.email,
          firstName:user.firstName,
          lastName:user.lastName,
          username: user.username,
        };
        return res.json({
          user: safeUser
        });
      } else return res.json({ user: null });
    }
  );


module.exports = router;