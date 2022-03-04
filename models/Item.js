const mongoose=require('mongoose');
const {schema}=mongoose;

const itemSchema=new schema({
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
  // image:{

  // }
});

module.exports=mongoose.model('item', itemSchema);