const crypto = require("crypto");
const express = require('express');
const Isadmin = require('../middlewares/Isadmin');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fetchuser = require('../middlewares/fetchuser');
const multer = require("multer");
const { roles } = require('../roles');
const sendEmail = require('../verification/Email');
const Token = require('../models/Token');
const jwt = require('jsonwebtoken'); 
const deleteImage = require("../middlewares/deleteImage");
// require('dotenv').config();
const JWT_secret = process.env.JWT_SECRET_KEY;

// ***multer function for middleware***
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/user_Images");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + file.originalname)
  }
})

// ***multer middleware***
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 2
  }
});

// Router 1.1) - create a user using POST:'/api/auth/createuser' No login required
router.post('/createuser',
  upload.single('user_image'),
  [
    body('name').isLength({ min: 2 }),
    body('email').isEmail().contains("@nitt.edu"),
    body('password').isLength({ min: 5 }),
    body('mobile_no').isLength({ min: 10, max: 10 }),
    body('department').isLength({ min: 2 }),
    body('gender').isLength({ min: 4 }),
  ], async (req, res) => {
    // Try block starts from here
    try {
      //check for validaion errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        deleteImage(req.file.path);
        return res.status(501).json({ success: false, message: "Enter the valid credentials", error: errors.array() });
      }

      // image name
      let image_name = "defaultImage";
      if (req.file) {
        image_name = req.file.filename;
      }

      // check whether user with same email id exist
      let user = await User.findOne({ $or: [{ email: req.body.email }, { mobile_no: req.body.mobile_no }] });
      if (user) {
        if(user.verified){
          deleteImage(req.file.path);
          return res.status(503).json({ success: false, message: "The user with this email or mobile number already exist" });
        }else{
          let path=`./public/user_Images/${user.user_image}`;
          deleteImage(path);
          let r=await User.deleteOne( {"_id": user.id});
        }
      }

      //hashing of password
      const salt = bcrypt.genSaltSync(10);
      const securePassword = bcrypt.hashSync(req.body.password, salt);

      let role = roles.CLIENT;
      if (req.body.email === process.env.ADMIN_EMAIL) {
        role = roles.ADMIN;
      }

      // Now Create a new User in mongoDB
      user = await User.create(
        {
          name: req.body.name,
          email: req.body.email,
          password: securePassword,
          mobile_no: req.body.mobile_no,
          user_image: image_name,
          department: req.body.department,
          gender: req.body.gender,
          role: role
        }
      )

      // **** Saving Token for email verification purpose ****
      let token = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      // Token.createIndexes( { "expireAt": 1 }, { expireAfterSeconds: 360 } )
      const v_link = `http://localhost:3000/verify/${user.id}/${token.token}`;
      sendEmail(v_link, req.body.email);


      // Now using user id create a JWT token for security and authenticity
      const data = { user: user.id };
      const auth_token = jwt.sign(data, JWT_secret);

      // Now set this flag to true and send with the user data
      res.json({ success: true, auth_token });

    } catch (error) {
      // first delete the saved image
      deleteImage(req.file.path);
      return res.status(505).json({ success: false, message: error.message, from:"Catch Section | Create User" });
    }
  })
// Router -1.2 For Email verification***********
router.get("/verify/:id/:token", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if(user.verified) return res.send({ success: true, message: "Email verified sucessfully" });
    if (!user) return res.status(404).send({ success: false, message: "Your email not found in database" });

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(401).send({ success: false, message: "Link has expired" });

    await User.updateOne({ _id: req.params.id }, { $set: { verified: true } });
    await Token.findByIdAndRemove(token._id);

    res.send({ success: true, message: "Email verified sucessfully" });
  } catch (error) {
    res.status(404).send({ success: false, message: error.message, from: "Verify Email | Catch Section" });
  }
});



// Router 2) - Login a user using POST:'/api/auth/loginUser' - No login required
router.post('/loginUser', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password length should be enough').isLength({ min: 5 })
], async (req, res) => {
  
  try {
    //check for validaion errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(506).json({ success: false, message: errors.array() });
    }
    // Destructure the email and password from req body
    const { email, password } = req.body;

    // Check whether user with this email is in mongoDB or not
    let user = await User.findOne({ email: email });
    if (!user) {
      res.status(507).json({ success: false, message: "User not found!!" });
      return;
    }

    if (user.isBlocked || !(user.verified)) {
      return res.json({ success: false, message: "Either You are blocked by admin or Email not verified", from: "Login User" });
    }

    // if User exist then compare the passwords
    const comparePaswd = await bcrypt.compare(password, user.password);
    if (!comparePaswd) {
      return res.status(508).json({ success: false, message: "Enter the valid password" });
    }

    // returning user id in Token
    const data = { user: user.id };  // this id will be retreived at the time of authentication
    // and at the time of fething the user deails
    const auth_token = jwt.sign(data, JWT_secret);

    // if password a also is same then send the flag=true with user data
    res.json({ success: true, auth_token });

  } catch (error) {
    res.status(509).json({ success: false, message: error.message });
  }

})

// Route:3 - Get Loggedin User details using:POST  "/api/auth/getuser"  Login required
router.post('/getuser', fetchuser, async (req, res) => {
  const user_id = req.user_id;  // this is the user id that we set at the time of generating web token
  const user_data = await User.findById(user_id).select("-password");//except password
  res.send({ success: true, user_data: user_data });
})

// Route:4 - Get User details By using Id:POST.  "/api/auth/getUserById/:id".  Login required
router.post('/getUserById/:id', fetchuser, async (req, res) => {
  try {
    const uploader = await User.findById(req.params.id).select("-password");//except password
    res.send({ success: true, uploader });
  } catch (error) {
    res.status(509).json({ success: false, message: error.message, message2: "Catch Section" });
  }
})

// ******* ADMIN AREA ************
// Router:1 - getAll Users By Admin
router.get('/getAllUsers', fetchuser, Isadmin, async (req, res) => {
  try {
    const curr_user = await User.findById(req.user_id);
    const users = await User.find().select("-password");
    res.send({ success: true, users: users });
  } catch (error) {
    res.status(509).json({ success: false, message: error.message, message2: "Can not fetch all users!!!" });
  }
});


// Router:2 - Block A user by Admin only
router.post('/blockAUser/:id', fetchuser, Isadmin, async (req, res) => {
  try {
    const currUser = await User.findById(req.user_id).select("-password");
    const usertoBlock = await User.findById(req.params.id).select("-password");
    const user = await User.updateOne({ _id: req.params.id }, { $set: { "isBlocked": !usertoBlock.isBlocked } });
    const updatedStatus = await User.findById(req.params.id).select("isBlocked");
    res.json({ success: true, result: user, newStatus: updatedStatus });
  } catch (error) {
    res.status(509).json({ success: false, message: error.message, message2: "Can not Block user!!!" });
  }
});

module.exports = router;