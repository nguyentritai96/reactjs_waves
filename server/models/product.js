const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = mongoose.Schema({
    name:{
        required: true,
        type: String,
        unique: 1,
        maxlength:100
    },
    description:{
        required: true,
        type: String,
        maxlength:100000
    },
    price:{
        required: true,
        type: Number,
        maxlength: 255
    },
    brand:{ // link to brand để lấy dữ liệu, sử dụng ID thay vì dùng tên, vì nó có thể thay đổi
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    shipping:{
        required: true,
        type: Boolean
    },
    available:{
        required: true,
        type: Boolean
    },
    wood:{ // link to wood
        type: Schema.Types.ObjectId,
        ref: 'Wood',
        required: true
    },
    frets:{
        required: true,
        type: Number
    },
    sold:{ 
        type: Number,
        maxlength: 100,
        default: 0
    },
    publish:{
        required: true,
        type: Boolean
    },
    images:{
        type: Array,
        default:[]
    }
},{timestamps:true}); // thời gian create và update

const Product = mongoose.model('Product',productSchema);
module.exports = { Product }