const express = require('express');
const router = express.Router();
const userDetails = require('../models/userDetails')
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken')
require('dotenv').config()


// authentication for token
const tokenAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const bearerHeader = authHeader.split(' ')[1];
    if (authHeader){
        jwt.verify(bearerHeader, process.env.TOKEN_SECRET, (err, signInTokenData) =>{
            if(err){
                console.log(err)
                return res.status(403).json()
            }
            req.body.signInTokenData = signInTokenData;
            next();
        });

    }else{
        res.sendStatus(401);
    }
}

router.post('/',tokenAuth,body('email').isEmail(),body('password').isAlphanumeric().isLength({min : 8}),async (req, res) =>{
    // validation error:
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try{
        const userEmail = req.body.email; // get mail from body of the request
        const userPassword = req.body.password; // get password from the body of the request
        const salt = await bcrypt.genSalt(10); // generate salt
        const matchedEmail = await userDetails.findOne({email: userEmail}).select({email:1,password:1}).lean().exec() // gets email and password from db
        const Emaildb = matchedEmail.email; // mail of the compared object
        const Passworddb = matchedEmail.password; // password of compared object
        const userPasswordEncrypt = await bcrypt.hash(userPassword, salt) // encrypted password from request

        // conditionals:
        const match = await bcrypt.compare(userPassword,userPasswordEncrypt);
        if (userEmail === Emaildb && match){
            const signInToken = await jwt.sign({userEmail}, process.env.TOKEN_SECRET, {expiresIn: '180000000000000s'})
            return res.status(200).json(signInToken);

        }
        else{
            return res.sendStatus(403);
        }

        // loop to get key value pars of object:
        /*
        for (const [key, value] of Object.entries(matchedEmail)) {
            console.log(`${key}: ${value}`);
        }
        */
        // encrypt password:

    }
    catch (err){
        res.status(400).json({message : err.message})
    }
})

module.exports = router;