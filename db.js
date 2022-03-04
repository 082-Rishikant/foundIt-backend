const mongoose=require('mongoose');

// require('dotenv').config();
// const mongoURI=process.env.MONGO_URI;

const mongoURI = "mongodb://localhost:27017/foundit?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

const connectToMongo=()=>{
    mongoose.connect(mongoURI, 
        ()=>{
      console.log("Connected to mongo successfully");
  })
}

module.exports=connectToMongo;