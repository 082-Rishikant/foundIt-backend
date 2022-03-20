const express = require('express');
const connectToMongo=require('./db');
const cors=require('cors');

const app = express();
// const port=5000;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Port Number using environmental variables
require('dotenv').config();
const port=process.env.PORT;

connectToMongo();


app.use(express.json());
app.use(cors());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/item', require('./routes/item'));

// app.get('/', (req, res)=>{
//   res.send("Hii");
// });

app.listen(port, ()=>{
  console.log(`App is running on the port ${port}`);
})