const express = require('express');
const connectToMongo=require('./db');
const cors=require('cors');

const app = express();

// Port Number using environmental variables
require('dotenv').config();
const port=process.env.PORT;
// const port=5000;

connectToMongo();


app.use(express.json());
app.use(cors());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/item', require('./routes/item'));
app.use("/item-img", express.static(__dirname+'/public/item_images'));
app.use("/user-img", express.static(__dirname+'/public/user_images'));
app.listen(port, ()=>{
  console.log(`App is running on the port ${port}`);
})