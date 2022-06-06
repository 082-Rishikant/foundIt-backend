const mongoose=require('mongoose');
const { Schema } = mongoose;

const Userschema = new Schema({
  name:  {
    type:String,
    required:true
  }, 
  email:  {
    type:String,
    required:true,
    unique:true
  }, 
  password:  {
    type:String,
    required:true
  },
  mobile_no:{
    type:String,
    required:true,
    unique:true
  },
  user_image:{
    type:String
  },
  department:{
    type:String,
    required:true
  },
  date:{
    type:Date,
    default:Date.now
  },
  gender:{
    type:String,
    required:true
  }
});

module.exports=mongoose.model('user', Userschema);