const mongoose = require('mongoose');

const brandSchema = mongoose.Schema({
    name : {
        type : String,
        maxlength : 100,
        required : true,
        unique : 1
    }
})

const Brand =  mongoose.model('Brand', brandSchema)

module.exports = { Brand }