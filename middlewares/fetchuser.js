const jwt=require('jsonwebtoken');
require('dotenv').config();
const JWT_secret=process.env.JWT_SECRET_KEY;

const fetchuser=(req, res, next)=>{
  const auth_token=req.header('auth_token');
  if(!auth_token){
    res.status(401).json({from:"fethcUser", message:"Please use a valid token"});
    return;
  }
  try {
    const user_data=jwt.verify(auth_token, JWT_secret);
    req.user_id=user_data.user; // this is user id we have at the time of generating web token
    next();
  } catch (error) {
    res.status(500).json({from:"fethcUser", error:"catch: please use a valid token"});
  }
}

module.exports=fetchuser;