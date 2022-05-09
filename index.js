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

app.listen(port, ()=>{
  console.log(`App is running on the port ${port}`);
})