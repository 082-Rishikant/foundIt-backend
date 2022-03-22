const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const multer = require("multer");
const path = require('path');

// ***Defined by me***
const Item = require('../models/Item');
const fetchuser = require('../middlewares/fetchuser');

// ***Json Web Token***
const jwt = require('jsonwebtoken'); // Used for generate tokens for security purpose and we will send this token to loggedin user to verify in future that current user loggedin or not
require('dotenv').config();
const JWT_secret = process.env.JWT_SECRET_KEY;

// // define a default path to store the image on local storage
// router.use(express.static(__dirname+"./public/"));

// ***multer function for middleware***
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + file.originalname)
  }
})

// ***multer middleware***
const upload = multer({
  storage: storage
  // limits:{
  //   fileSize:1024*1024*5
  // }
});


// Router 1) - Upload an Item using POST:'/api/item/uploaditem' | login required
router.post('/uploaditem', [
  body('name').isLength({ min: 3 }),
  body('place').isLength({ min: 3 }),
  fetchuser
], upload.single('image'),
  async (req, res, next) => {
    let success = false;

    debugger;

    // JS validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(500).json({ errors: errors.array() });
    }

    try {
      // fetch the image file name after execution of multer middleware
      console.log(req.file);
      var image_name = req.file.filename;

      // create an new item using Item model
      const item = new Item({
        user: req.user_id,
        name: req.body.name,
        type: req.body.type,
        date: req.body.date,
        place: req.body.place,
        description: req.body.description
      });
      success = true;

      // Now save the item to mongodb
      const savedItem = await item.save();

      res.send({ success, image_name, savedItem });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });


module.exports = router;