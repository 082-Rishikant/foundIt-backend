const mongoose=require('mongoose');

require('dotenv').config();

const mongoURI = `mongodb://localhost:27017/${process.env.DB_NAME}?readPreference=primary&appname=MongoDB%20Compass&ssl=false`;

const connectToMongo=()=>{
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true},      
).then((link) => {
  console.log("Connected to mongo successfully")
})
.catch(() => {
  console.log("Database not connected.");
})
}

module.exports=connectToMongo;