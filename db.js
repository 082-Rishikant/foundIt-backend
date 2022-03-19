const mongoose=require('mongoose');

require('dotenv').config();

const mongoURI = `mongodb://localhost:27017/${process.env.DB_NAME}?readPreference=primary&appname=MongoDB%20Compass&ssl=false`;

const connectToMongo=()=>{
    mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true}, 
        ()=>{
      console.log("Connected to mongo successfully");
  })
}

module.exports=connectToMongo;