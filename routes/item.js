
const express = require('express');
const Item = require('../models/Item');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const fetchuser = require('../middlewares/fetchuser');
const upload_item_middleware = require('../middlewares/upload_item_middleware');

// Json Web Token*********
const jwt = require('jsonwebtoken'); // Used for generate tokens for security purpose and we will send this token to loggedin user to verify in future that current user loggedin or not
require('dotenv').config();
const JWT_secret = process.env.JWT_SECRET_KEY;

// Router 1) - Upload an Item using POST:'/api/item/uploaditem' | login required
router.post('/uploaditem', [
  body('name').isLength({ min: 3 }),
  body('place').isLength({ min: 3 }),
  fetchuser,
  // upload_item_middleware.image_upload, 
],
  async (req, res) => {
    let success = false;

    // JS validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(500).json({ errors: errors.array() });
    }

    // create an new item using Item model
    const { name, type, date, place, description } = req.body;
    const item = new Item({ user: req.user_id, name, type, date, place, description });
    success = true;

    // Now save the item to mongodb
    const savedItem=await item.save();

    res.json({ success, savedItem });
  });


module.exports = router;