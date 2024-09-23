const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { body } = require('express-validator');
const errorMessagehanlder = require('../Middleware/handleErrorMessage');
const User = require('../models/User');
router.post('/login', UserController.login);
router.post('/register', [
        body('name').notEmpty(),
        body('email').notEmpty(),
        body('email').custom(async value => {
            const user = await User.findOne({email : value});
            if (user) {
              throw new Error('E-mail already in use');
            }
        }),
        body('password').notEmpty(),
    ],errorMessagehanlder,UserController.register);

module.exports = router;