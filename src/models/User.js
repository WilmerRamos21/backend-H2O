import {Schema, model} from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema({
    name: {
        type: String,
        required: false,
        trim: true
    },
    lastname:{
        type: String,
        required: false,
        trim: true
    },
    addresses: [
        {
            detail: { type: String, trim: true },
            city: { type: String, trim: true },
            isDefault: { type: Boolean, default: false },
            alias: { type: String, trim: true }, // Ej: "Casa", "Oficina"
            status : {type: Boolean, default: true}
        }
    ],
    phone:{
        type: String,
        trim: true,
        default:null
    }
    ,
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    status:{
        type: Boolean,
        default: true
    },
    token:{
        type: String,
        default: null
    },
    confirmEmail:{
        type: Boolean,
        default: false
    },
    role:{
        type: String,
        enum: ['ADMIN', 'EMPLEADO' ,'CLIENTE'],
        default: 'CLIENTE'
    }
},{
    timestamps: true
});

// Method to encrypt password
userSchema.methods.encryptPassword = async function(password){
    const salt = await bcrypt.genSalt(10);
    const passwordEncrypt= await bcrypt.hash(password, salt);
    return passwordEncrypt;
};

// Method to verify if the password is the same as the BDD
userSchema.methods.matchPassword = async function(password){
    const response = await bcrypt.compare(password, this.password);
    return response;
};

// Method to create a token for the user
userSchema.methods.createToken = function(){
    const generatedToken = Math.random().toString(36).slice(2);
    this.token = generatedToken;
    return generatedToken;
};

export default model('User', userSchema);