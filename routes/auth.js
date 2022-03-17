// auth stands ---> for user Authentication like Signup first, Login first before accessing your data

const express = require('express');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fetchuser=require('../middlewares/fetchuser');

// Json Web Token*********
const jwt = require('jsonwebtoken'); // Used for generate tokens for security purpose and we will send this token to loggedin user to verify in future that current user loggedin or not
require('dotenv').config();
const JWT_secret=process.env.JWT_SECRET_KEY;

// Router 1) - create a user using POST:'/api/auth/createuser' No login required
router.post('/createuser', [
  body('name').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 5 }),
  body('mobile_no').isLength({ min: 10 }),
], async (req, res) => {
  let success=false;
  //check for validaion errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(500).json({ errors: errors.array() });
  }
  // Try block starts from here
  try {
    // check whether user with same email id exist
    let user=await User.findOne({ email: req.body.email });
    if(user){
      res.status(500).json({success, error:"The user with this email already exist"});
      return;
    }

    //hashing of password
    const salt = bcrypt.genSaltSync(10);
    const securePassword = bcrypt.hashSync(req.body.password, salt);

    // Now Create a new User in mongoDB
    user = await User.create(
      {
        name: req.body.name,
        email: req.body.email,
        password: securePassword,
        mobile_no:req.body.mobile_no
      }
    )

    // Now using user id create a JWT token for security and authenticity
    // So that we can check whether a user is loggedin or not or is it a registered user
    const data={user:user.id};
    const auth_token=jwt.sign(data, JWT_secret);
    
    // Now set this flag to true and send with the user data
    success=true;
    res.json({success, auth_token});

  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})


// Router 2) - Login a user using POST:'/api/auth/loginUser' - No login required
router.post('/loginUser', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password length should be enough').isLength({min:5})
], async (req, res)=>{
  let success=false;
  //check for validaion errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(500).json({ errors: errors.array() });
  }

  try {
    // Destructure the email and password from req body
    const {email, password}=req.body;

    // Check whether user with this email is in mongoDB or not
    let user=await User.findOne({email:email});
    if(!user){
      res.status(501).json({success, error:"Please enter valid credentials"});
      return;
    }

    // if User exist then compare the passwords
    const comparePaswd = await bcrypt.compare(password, user.password);
    if(!comparePaswd){
      res.status(500).json({success, error:"Enter the valid password"});
      return;
    }

    // returning user id in Token
    const data={user:user.id};  // this id will be retreived at the time of authentication
    // and at the time of fething the user deails
    const auth_token=jwt.sign(data, JWT_secret);

    // if password a also is same then send the flag=true with user data
    success=true;
    res.json({success, auth_token});

  } catch (error) {
    res.status(500).json({error:error.message});
  }

})


// Route:3 - Get Loggedin User details using:POST  "/api/auth/getuser"  Login required
router.post('/getuser', fetchuser, async (req, res)=>{
  const user_id=req.user_id;  // this is the user id that we set at the time of generating web token
  const user_data=await User.findById(user_id).select("-password");//except password
  res.send({user_data});
})

module.exports = router;