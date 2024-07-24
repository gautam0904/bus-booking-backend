import mongoose from "mongoose";
import bcrypt from 'bcryptjs'
import { errMSG } from "../Constant/message";

const roleValues = ['user' , 'admin']

const userSchema = new mongoose.Schema({
    name :{
        type : String,
        required : [true , errMSG.REQUIRED('User name')],
    },
    email : {
        type : String,
        required : [true , errMSG.REQUIRED('User email')],
        unique : true
    },
    password : {
        type : String,
        required : [true , errMSG.REQUIRED('User password')]
    },
    role : {
        type : String,
        default : 'user',
    },
},{timestamps : true});

userSchema.pre('save' , function(){
    if(this.isModified('password')){
        this.password = bcrypt.hashSync(this.password , 10);
    }
})

const User = mongoose.model('User' , userSchema);

export default User;