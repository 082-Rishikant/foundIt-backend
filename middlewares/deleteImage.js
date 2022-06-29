const fs = require("fs");

const deleteImage = (path) =>{
  try {
    if (path) {
      fs.unlink(path, (err) => {
        if (err) {
          console.log(err.message);
        }
      })
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = deleteImage;