const mongoose = require('mongoose');

const woodSchema = mongoose.Schema({
    name : {
        type : String,
        unique : 1,
        maxlength : 100,
        required : true
    }
});

const Wood = mongoose.model('Wood', woodSchema);

module.exports = { Wood }