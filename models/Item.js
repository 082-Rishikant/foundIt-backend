const mongoose=require('mongoose');
const {Schema}=mongoose;

const itemSchema=new Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user'
  },
  name:{
    type:String,
    required:true
  },
  type:{
    type:String
  },
  date:{
    type:Date,
    default:Date.now
  },
  place:{
    type:String,
    required:true
  },
  description:{
    type:String
  },
  image_name:{
    type:String,
    required:true
  }
});

module.exports=mongoose.model('item', itemSchema);