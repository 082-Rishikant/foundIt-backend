const express = require('express');
const router = express.Router();
const multer = require("multer");
// const path = require('path');
const { body, validationResult } = require('express-validator');
const fs = require("fs");

// ***Defined by me***
const Item = require('../models/Item');
const User = require('../models/User');
const fetchuser = require('../middlewares/fetchuser');

// ***Json Web Token***
const jwt = require('jsonwebtoken'); // Used for generate tokens for security purpose and we will send this token to loggedin user to verify in future that current user loggedin or not
require('dotenv').config();
const JWT_secret = process.env.JWT_SECRET_KEY;

// // define a default path to store the image on local storage
// router.use(express.static(__dirname+"./public/"));


// Router - 1 Code starts from here*****************************
// Router 1) - Upload an Item using POST:'/api/item/uploaditem' | login required

// ***multer function for middleware***
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/item_Images");
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
    fileSize: 1024 * 1024 * 5
  }
});


router.post('/uploaditem',
  fetchuser,
  upload.single('image'),
  [
    // validation rules for input
    body('name', 'Enter a valid item name').isLength({ min: 2 }),
    body('place', 'Enter a valid item name').isLength({ min: 2 })
  ],
  async (req, res, next) => {
    let success = false;

    //check for validaion errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          return res.status(500).json({ from: "delete a just stored file when textfield is not valid", errors: err });
        }
      })
      return res.status(500).json({ errors: errors.array() });
    }

    try {
      // fetch the image file name after execution of multer middleware
      const image_name = req.file.filename;

      // create an new item using Item model
      let date=new Date();
      if(req.body.date){
        date=new Date(req.body.date);
      }
      const item = new Item({
        user: req.user_id,
        name: req.body.name,
        type: req.body.type,
        date: date,
        day:date.getDate(),
        month:date.getMonth()+1,
        year:date.getFullYear(),
        place: req.body.place,
        description: req.body.description,
        image_name: image_name
      });
      success = true;

      // Now save the item to mongodb
      const savedItem = await item.save();

      res.send({ success, savedItem });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });


// Router 2) - fetch all Items of a user using POST:'/api/item/fetchitems' | login required
router.post('/fetchitems',
  fetchuser,
  async (req, res, next) => {
    try {
      // fetch all items of current user from DB with the help of user_id
      const user_id = req.user_id;
      let items_list = await Item.find({ user: user_id }).exec();

      res.send({ items_list });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });


// Router 3) - Search Item GET:'/api/item/searchItem' | login required
router.get('/searchItem',
  fetchuser,
  async (req, res, next) => {
    try {
      // Destructure all the searching terms
      const { name, place, date, type } = req.body;
      const d = new Date(date);
      const year=d.getFullYear();
      const month=d.getMonth()+1;
      const day=d.getDate();

      // Fetch all items those matches
      let items_list = await Item.find({$or:[{ name: name, type: type, year:year, month:month, day:day}]}).exec();
      
      // update them with user details
      for (var rep = 0; rep < items_list.length; rep++) {
        let user_id=items_list[rep].user;
        let uploader_user = await User.findById(user_id).select("name mobile_no user_image department");
        items_list[rep].set('user', uploader_user);
      }

      res.send({ items_list });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

module.exports = router;