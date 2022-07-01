const express = require('express');
const router = express.Router();
const multer = require("multer");
const { body, validationResult } = require('express-validator');

const Item = require('../models/Item');
const User = require('../models/User');
const fetchuser = require('../middlewares/fetchuser');
const deleteImage=require('../middlewares/deleteImage');
require('dotenv').config();



// Router- 1 ADD an Item using POST:'/api/item/uploaditem' | login required**********

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
const upload = multer({storage: storage, limits: {fileSize: 1024 * 1024 * 2}});

// Router - 1 ADD and Item *******
router.post('/uploaditem',
  fetchuser,
  upload.single('image'),
  [
    // validation rules for input
    body('name', 'Enter a valid item name').isLength({ min: 2 }),
    body('place', 'Enter a valid item name').isLength({ min: 2 }),
    body('type', 'Enter a valid item type').isLength({ min: 2 }),
    body('status', 'Enter a valid status').isLength({ min: 4 })
  ],
  async (req, res) => {
    try {
      //check for validaion errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        deleteImage(req.file.path);
        return res.status(502).json({ success: false, message: "Some errors in creds validation", errors: errors.array() });
      }
      // fetch the image file name after execution of multer middleware
      let image_name="defaultimage"
      if(req.file){ image_name = req.file.filename; }

      // create an new item using Item model
      let date = Date.now;
      if (req.body.date) {
        date = new Date(req.body.date);
      }
      const item = new Item({
        user: req.user_id,
        name: req.body.name,
        type: req.body.type,
        date: date,
        place: req.body.place,
        description: req.body.description,
        image_name: image_name,
        user_name: req.body.user_name,
        status:req.body.status
      });
      // Now save the item to mongodb
      const savedItem = await item.save();

      res.send({ success: true, savedItem });
    } catch (error) {
      deleteImage(req.file.path);
      return res.status(503).send({ success: false, from: "Catch section", message: error.message });
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
      res.json({success:true, items_list});
    } catch (error) {
      res.status(500).send({success:false,  message: error.message });
    }
  });

// Router 3: Delete an existing Item using:DELETE   '/api/item/deleteItem:id'   Login required;
router.delete('/deleteItem/:id', fetchuser, async (req, res) => {
  try {
    // checking whether item exist or not, If find then delete
    let item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(400).send({ success: false, message: "Item not found that you want to delete" });
    }

    // checking whether user owns this item or not
    if (item.user.toString() !== req.user_id) {
      return res.status(401).send({ success: false, message: "sorry!! You are not allowed to delete this item" });
    }
    // Finaly deleting Image**
    let path=`./public/item_Images/${item.image_name}`;
    deleteImage(path);
    // finaly Deleting item**
    item = await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Item deleted successfully", item: item });
  } catch (error) {
    console.error(error.message);
    res.status(402).send({ success: false, message: error.message, from: "deleteItem | catch" });
  }
})


// Router 4: Update an existing Item using:PUT   '/api/item/updateItem/:id'   Login required;
router.put('/updateItem/:id',
  fetchuser,
  upload.single('image'), [
  // validation rules for input
  body('name', 'Enter a valid item name').isLength({ min: 2 }),
  body('place', 'Enter a valid item name').isLength({ min: 2 })
],
  async (req, res, next) => {
    
    try {
      //check for validaion errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {  
        if(req.file) deleteImage(req.file.path);
        return res.status(502).json({ success: false, from: "creds validation", message: errors.array() });
      }
      const { name, type, place, date, description } = req.body;
      const image_name = req.file.filename;
      
      // Making a item that will replace old existing item
      const newItem = {};
      if (name) newItem.name = name;
      if (type) newItem.type = type;
      if (place) newItem.place = place;
      if (date){
        newItem.date = date;
      }else{
        newItem.date=Date.now;
      }
      if (description) newItem.description = description;
      if (image_name) newItem.image_name = image_name;
      
      // checking whether item exist or not, If exist then Update it
      let item = await Item.findById(req.params.id);
      if (!item) {
        if(req.file) deleteImage(req.file.path);
        return res.status(404).send({ success: false, message: "Item not found to update" });
      }

      // checking whether user owns this Item or not
      if (item.user.toString() !== req.user_id) {
        if(req.file) deleteImage(req.file.path);
        return res.status(401).send({ success: false, message: "You are not allowed to update this Item" });
      }

      // Finaly deleting Image**
      let path=`./public/item_Images/${item.image_name}`;
      deleteImage(path);

      // Finaly updating in mongo DB**
      item = await Item.findByIdAndUpdate(req.params.id, { $set: newItem }, { new: true })
      res.json({success:true, item});
    } catch (error) {
      if(req.file) deleteImage(req.file.path);
      res.status(500).send({success:false, message:error.message, from:"Catch section"});
    }
  })

// Router 5: getAllItems || Login required
router.get('/getAllItems', fetchuser, async (req, res)=>{
  try{
    const allitems=await Item.find();
    res.send({success:true, allitems:allitems});
  }catch (error) {
    res.status(402).send({ success: false, message: error.message, from: "getAllItems" });
  }
})

// Router 6: getAItem || Login required
router.get('/getAItem/:id', fetchuser, async (req, res)=>{
  try{
    const item=await Item.findById(req.params.id);
    res.send({success:true, item:item});
  }catch (error) {
    res.status(402).send({ success: false, message: error.message, from: "getAItem" });
  }
})


module.exports = router;