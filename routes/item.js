const express = require('express');
const router = express.Router();
const multer = require("multer");
const { body, validationResult } = require('express-validator');
const fs = require("fs");
// const path = require('path');

// ***Defined by me***
const Item = require('../models/Item');
const User = require('../models/User');
const fetchuser = require('../middlewares/fetchuser');

// ***Json Web Token***
const jwt = require('jsonwebtoken'); // Used for generate tokens for security purpose and we will send this token to loggedin user to verify in future that current user loggedin or not
require('dotenv').config();
const JWT_secret = process.env.JWT_SECRET_KEY;



// Router- 1 Upload an Item using POST:'/api/item/uploaditem' | login required**********

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

    //check for validaion errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          return res.status(501).json({ success:false, message: "delete a just stored file when textfield is not valid", errors: err });
        }
      })
      return res.status(502).json({ success:false, message:"Some errors in creds validation", errors: errors.array() });
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
      // Now save the item to mongodb
      const savedItem = await item.save();

      res.send({ success:true, savedItem });
    } catch (error) {
      return res.status(503).send({success:false, message:"Catch section",  error: error.message });
    }
  });


// Router 2) - fetch all Items of a user using GET:'/api/item/fetchitems' | login required
router.get('/fetchitems',
  fetchuser,
  async (req, res, next) => {
    try {
      // fetch all items of current user from DB with the help of user_id
      const user_id = req.user_id;
      let items_list = await Item.find({ user: user_id });

      res.json(items_list);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });


// Router 3) - Search Item POST:'/api/item/searchItem' | login required
router.post('/searchItem',
  async (req, res) => {
    try {
      // ****Destructure all the searching terms****
      const { name, place, date, type } = req.body;
      // const d = new Date(date);
      // const year=d.getFullYear();
      // const month=d.getMonth()+1;
      // const day=d.getDate();

      // Fetch all items those matches
      let items_list = await Item.find({$or:[{ name: name, type: type, place:place}]});
      
      // update them with user details
      for (var rep = 0; rep < items_list.length; rep++) {
        let user_id=items_list[rep].user;
        let uploader_user = await User.findById(user_id).select("name mobile_no user_image department");
        items_list[rep].set('user', uploader_user);
      }

      res.send({success:true, items_list });
    } catch (error) {
      res.status(500).send({success:false, message: error.message });
    }
  });


// Router 4: Delete an existing Item using:DELETE   '/api/item/deleteItem:id'   Login required;
router.delete('/deleteItem/:id', fetchuser, async (req, res) => {
  try {
    // checking whether item exist or not, If find then delete
    let item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(400).send({success:false, message:"Item not found that you want to delete"});
    }

    // checking whether user owns this item or not
    if (item.user.toString() !== req.user_id) {
      return res.status(401).send({success:false, message:"sorry!! You are not allowed to delete this item"});
    }
    // Finaly deleting Image**
    fs.unlink(`./public/item_Images/${item.image_name}`, (err) => {
      if (err) {
        return res.status(501).json({ success:false, message2: "sorry! Not able to delete a image", message: err });
      }
    })
    // finaly Deleting item**
    item = await Item.findByIdAndDelete(req.params.id);
    res.json({success:true,message:"Item deleted successfully",item:item});
  } catch (error) {
    console.error(error.message);
    res.status(402).send({success:false, message:error.message, message2:"catch"});
  }
})


module.exports = router;