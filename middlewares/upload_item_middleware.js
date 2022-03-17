const { body, validationResult } = require('express-validator');

const upload_item_middleware = {
  image_upload: function (req, res, next) {
    console.log('Original request hit : ');
    next();
  }
}

module.exports = upload_item_middleware;