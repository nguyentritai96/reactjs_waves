const mongoose = require('mongoose'); // import để kết nối cơ sở dữ liệu. quản lí dữ liệu thông qua model

require('dotenv').config(); // lấy lại file env để dùng biến SECRET

const bcrypt = require('bcrypt'); // tạo mã hash cho mật khẩu = salt + password
const SALT_I = 10; // tạo mã salt

const jwt = require('jsonwebtoken'); // import để tạo token khi đăng nhập thành công

const userSchema = mongoose.Schema({ // schema : sơ đồ. tạo ra khuôn dữ liệu (model)
    // khi post: có giá trị => tạo giá trị, không có giá trị => thì tạo theo default, không có default => không tạo
    email: {
        type: String,
        required: true,
        trim: true, // xóa khoảng trắng đầu và cuối
        unique: 1
    },
    password: {
        type: String,
        required: true,
        minlength: 5
    },
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    lastname: {
        type: String,
        required: true,
        maxlength: 100
    },
    cart: {
        type: Array,
        default: []
    },
    history: { // đồ đã mua
        type: Array,
        default: []
    },
    role: { // chế độ của user
        type: Number,
        default: 0
    },
    token: {
        type: String
    }
});


// Tạo mã hash cho dữ liệu, mã hash sẽ bao gồm salt + password
userSchema.pre('save', function (next) { 
    // pre là sẽ lắng nghe trước khi thực hiện save(). 
    // next chính là hàm save() được chạy của userSchema
    var user = this; // do dùng ES5 nên phải lấy lại biến this
    if (user.isModified('password')) { 
        // chỉ khi nào thay đổi password hoặc tạo tài khoản thì mới dùng hash
        bcrypt.genSalt(SALT_I, function (err, salt) {
            if (err) return next(err);
            bcrypt.hash(user.password, salt, function (err, hash) {// sử dụng password + salt => mã hash
                if (err) return next(err);
                user.password = hash;
                next();
            })
        })
    } else {
        next(); // khi thay đổi các thông tin khác (ngoại trừ password)
    }
})


// So sánh password khi login
userSchema.methods.comparePassword = function (candidatePassword, cb) { 
    // định nghĩa hàm cha và gọi callback sử dụng cho user, giống tạo prototype
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        // Phương thức compare sẽ xử lí là trả về isMatch, nếu trùng là true và không trùng là false.
        if (err) return cb(err); // lỗi do xử lí file
        cb(null, isMatch);
    })
}

userSchema.methods.generateToken = function (cb) {
    var user = this;
    var token = jwt.sign(user._id.toHexString(), process.env.SECRET); // không dùng secrert thì phải?? check lại sau
    user.token = token;
    user.save(function (err, user) {
        if (err) return cb(err);
        cb(null, user);
    })
}

userSchema.statics.findByToken = function (token, cb) {
    var user = this;
    jwt.verify(token, process.env.SECRET, function (err, decode) {
        user.findOne({ "_id": decode, "token":token}, function (err, user) {
            if (err) return cb(err);
            cb(null, user)
        })
    })
}   


const User = mongoose.model('User', userSchema); // tạo model User để quản lí dữ liệu

module.exports = { User }