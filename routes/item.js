const express = require('express');
const Item = require('../models/Item');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const fetchuser = require('../middlewares/fetchuser');
// const upload = require("../middlewares/upload_image_middleware");

// Json Web Token*********
const jwt = require('jsonwebtoken'); // Used for generate tokens for security purpose and we will send this token to loggedin user to verify in future that current user loggedin or not
require('dotenv').config();
const JWT_secret = process.env.JWT_SECRET_KEY;

// router.use(express.static(__dirname+"./public/"));



// const multer = require("multer");
// const path=require('path');
// const storage = multer.diskStorage({
//   destination:"./public/images",
//   image_name:(req, cb)=>{
//       cb(null, file.fieldname+"_"+Date.now()+path.extname(file.originalname));
//   }
// });

// const upload=multer({
//   storage:storage
// }).single('image');



// Router 1) - Upload an Item using POST:'/api/item/uploaditem' | login required
router.post('/uploaditem', [
  body('name').isLength({ min: 3 }),
  body('place').isLength({ min: 3 }),
  fetchuser
],
  // upload,
  async (req, res, next) => {
    let success = false;

    // var image_name=req.file.fieldname;

    // JS validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(500).json({ errors: errors.array() });
    }

    try {
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

      res.send({ success, savedItem });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });


module.exports = router;