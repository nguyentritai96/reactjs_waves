// Framework vận hành mọi thứ
const express = require('express'); // framework của nodejs
const app = express();
const cloudinary = require('cloudinary');
const formidable = require('express-formidable');
require('dotenv').config(); // lấy dữ liệu bảo mật từ .env vì file này không thể chèn vào server.js

const async = require('async');

// Cloudinary để up hình
cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key : process.env.CLOUD_API_KEY,
    api_secret : process.env.CLOUD_API_SECRET    
})
// Middleware : bên thứ 3 cung cấp hoặc tự tạo
const bodyParser = require('body-parser'); // middleware xử lí json, text và mã hóa url
const cookiePaser = require('cookie-parser'); // Chuyển đổi header của cookie và phân bố đến các req.cookies
app.use(bodyParser.urlencoded({ extended : true })); // => dùng để lấy dữ liệu query
app.use(bodyParser.json()); // => lấy dữ liệu dạng json
app.use(cookiePaser()); // làm việc với cookie => lưu dữ liệu vào cookie
const { auth } = require('./middlewares/auth'); // kiểm tra token => đăng nhập
const { admin } = require('./middlewares/admin'); // kiểm tra vai trò, có phải admin không?

// Connect Database
const mongoose = require('mongoose'); // connect dữ liệu với mongoDB
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE , { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex : true,
    useFindAndModify : false
}); // kết nối dữ liệu lên mongoDB

// Models
const { User } = require('./models/user'); // import model User đã định nghĩa, User sẽ quản lí user trong database
const { Brand } = require('./models/brand');
const { Wood } = require('./models/wood');
const { Product } = require('./models/product');
const { Payment } = require('./models/payment');
const { Site } = require('./models/site');


//=============================
//          PRODUCT 
//=============================
app.post('/api/product/shop',(req,res)=>{

    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100; 
    let skip = parseInt(req.body.skip);
    let findArgs = {};

    for(let key in req.body.filters){
        if(req.body.filters[key].length >0 ){
            if(key === 'price'){
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                }
            }else{
                findArgs[key] = req.body.filters[key]
            }
        }
    }
    findArgs['publish'] = true;

    Product.
    find(findArgs).
    populate('brand').
    populate('wood').
    sort([[sortBy,order]]).
    skip(skip).
    limit(limit).
    exec((err,articles)=>{
        if(err) return res.status(400).send(err);
        res.status(200).json({
            size: articles.length,
            articles
        })
    })
})




app.post('/api/product/article', auth, admin, (req, res) => {
    const product = new Product(req.body);
    product.save((err, doc) => {
        if (err) return res.json({ success : false , err})
        res.status(200).json({
            success : true,
            article : doc
        })
    })
})

app.get('/api/product/articles_by_id', (req, res) => {
    let type = req.query.type; // single hoặc array
    let items = req.query.id; // có thể một id hoặc chuỗi id cách nhau bởi dấu phẩy
    if (type === "array") {
        let ids = req.query.id.split(','); // tách thành mảng
        items = [];
        items = ids.map(item => {
            return mongoose.Types.ObjectId(item)
        })
    }
    // items bây giờ là một hoặc một mảng
    Product
    .find({"_id" : {$in: items }})
    .populate('wood') // tới bảng Wood và lấy object ID đã lưu
    .populate('brand')
    .exec((err, doc) => {
        return res.status(200).send(doc)
    })
})

app.get('/api/product/articles', (req, res) => {
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    let order = req.query.order ? req.query.order : 'asc';
    let limit = req.query.limit ? parseInt(req.query.limit) : 100;

    Product
    .find()
    .populate('brand')
    .populate('wood')
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, articles) => {
        if (err) return res.status(400).send(err);
        res.status(200).send(articles)
    })
})


//=============================
//          WOOD 
//=============================
app.post('/api/product/wood', auth, admin, (req, res) => {
    const wood = new Wood(req.body);
    wood.save((err, doc) => {
        if (err) return res.json({ success: false, err});
        res.status(200).json({
            success : true,
            wood : doc
        })
    })
});

app.get('/api/product/woods', (req, res) => {
    Wood.find({}, (err, woods) => {
        if (err) return res.status(400).send(err);
        res.status(200).send(woods);
    })
});
//=============================
//          BRAND 
//=============================
app.post('/api/product/brand', auth, admin, (req, res) => {
    const brand = new Brand(req.body);
    brand.save((err, doc) => {
        if (err) return res.json({ success : false, err});
        res.status(200).json({
            success : true,
            brand : doc
        })
    })
});

app.get('/api/product/brands', (req, res) => {
    Brand.find({}, (err, brands) => {
        if (err) return res.status(400).send(err);
        res.status(200).send(brands)
    })
});



// USER:

// Auth khi login
app.get('/api/users/auth', auth, (req, res) => {
    res.status(200).json({
        isAdmin : req.user.role === 0 ? false : true,
        isAuth : true,
        email : req.user.email,
        name : req.user.name,
        lastname : req.user.lastname,
        role : req.user.role,
        cart : req.user.cart,
        history : req.user.history
    })
})

// Auth khi logout
app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id : req.user.id }, { token : ''}, (err, doc) => {
        if (err) return res.json({ success : false, err});
        return res.status(200).send({
            success: true
        })
    })
})

// Register
app.post('/api/users/register', (req, res) => {
    const user = new User(req.body); // tạo ra user lấy từ req đổ vào model User
    user.save((err, doc) => { // lưu dữ liệu vào database
        if (err) return res.json({success: false, err}); // nếu có lỗi
        res.status(200).json({ // nếu thành công
            success : true,
            // userData : doc
        });
    })
    res.status(200)
})

// Login
app.post('/api/users/login', (req, res) => {
    User.findOne({'email' : req.body.email}, (err, user) => { // kết quả không trả về lỗi, chỉ có user hay không user
        if(!user) return res.json({ loginSuccess : false, message : 'Auth failed, email not found'});
        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({ loginSuccess: false, message : 'Password is wrong'});
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err);
                res.cookie('w_auth',user.token).status(200).json({loginSuccess : true})
            })
        })
    })
})



app.post('/api/users/uploadimage',auth,admin,formidable(),(req,res)=>{
    cloudinary.uploader.upload(req.files.file.path,(result)=>{
        console.log(result);
        res.status(200).send({
            public_id: result.public_id,
            url: result.url
        })
    },{
        public_id: `${Date.now()}`,
        resource_type: 'auto'
    })
})

app.get('/api/users/removeimage',auth,admin,(req,res)=>{
    let image_id = req.query.public_id;

    cloudinary.uploader.destroy(image_id,(error,result)=>{
        if(error) return res.json({succes:false,error});
        res.status(200).send('ok');
    })
})


app.post('/api/users/addToCart',auth,(req,res)=>{

    User.findOne({_id: req.user._id},(err,doc)=>{
        let duplicate = false;

        doc.cart.forEach((item)=>{ // check xem có trùng món hàng không?
            if(item.id == req.query.productId){
                  duplicate = true;  
            }
        })

        if(duplicate){ // tìm id và tăng số lượng quantity 
            User.findOneAndUpdate(
                {_id: req.user._id, "cart.id":mongoose.Types.ObjectId(req.query.productId)},// tìm
                { $inc: { "cart.$.quantity":1 } },// tăng lên 1
                { new: true },
                ()=>{
                    if(err) return res.json({success:false,err});
                    res.status(200).json(doc.cart)
                }
            )
        } else { // mua mới
            User.findOneAndUpdate(
                {_id: req.user._id}, // tìm user
                { $push:{ // dùng để thêm vào
                    cart:{
                        id: mongoose.Types.ObjectId(req.query.productId),
                        // do mình chỉ quản lí bằng id nên sẽ không add name vào
                        quantity:1,
                        date: Date.now()
                        } 
                }},
                { new: true }, 
                (err,doc)=>{
                    if(err) return res.json({success:false,err});
                    res.status(200).json(doc.cart)
                }
            )
        }
    })
});


app.get('/api/users/removeFromCart',auth,(req,res)=>{
    User.findOneAndUpdate(
        {_id: req.user._id },
        { "$pull": // dùng để xóa
            { "cart": {"id":mongoose.Types.ObjectId(req.query._id)} }
        },
        { new: true },
        (err,doc)=>{
            // nên dùng cách này để lấy lại dữ liệu và trả về client
            let cart = doc.cart; // doc là thông tin user
            let array = cart.map(item=>{
                return mongoose.Types.ObjectId(item.id)
            });

            Product.
            find({'_id':{ $in: array }}).
            populate('brand').
            populate('wood').
            exec((err,cartDetail)=>{
                return res.status(200).json({
                    cartDetail,
                    cart
                })
            })
        }
    );
})


app.post('/api/users/successBuy',auth,(req,res)=>{
    let history = [];
    let transactionData = {}

    // user history
    req.body.cartDetail.forEach((item)=>{
        history.push({
            dateOfPurchase: Date.now(),
            name: item.name,
            brand: item.brand.name,
            id: item._id,
            price: item.price,
            quantity: item.quantity,
            paymentId: req.body.paymentData.paymentID
        })
    })

    // PAYMENTS DASH
    transactionData.user = {
        id: req.user._id,
        name: req.user.name,
        lastname: req.user.lastname,
        email: req.user.email
    }
    transactionData.data = req.body.paymentData;
    transactionData.product = history;
        
    User.findOneAndUpdate(
        { _id: req.user._id },
        { $push:{ history:history }, $set:{ cart:[] } },
        { new: true },
        (err,user)=>{
            if(err) return res.json({success:false,err});

            const payment = new Payment(transactionData);
            payment.save((err,doc)=>{
                if(err) return res.json({success:false,err});
                let products = [];
                doc.product.forEach(item=>{
                    products.push({id:item.id,quantity:item.quantity})
                 })
              
                async.eachSeries(products,(item,callback)=>{ 
                    Product.update(
                        {_id: item.id},
                        { $inc:{
                            "sold": item.quantity
                        }},
                        {new:false},
                        callback
                    )
                },(err)=>{
                    if(err) return res.json({success:false,err})
                    res.status(200).json({
                        success:true,
                        cart: user.cart,
                        cartDetail:[]
                    })
                })
            });
        }
    )
});


app.post('/api/users/update_profile',auth,(req,res)=>{

    User.findOneAndUpdate(
        { _id: req.user._id },
        {
            "$set": req.body
        },
        { new: true },
        (err,doc)=>{
            if(err) return res.json({success:false,err});
            return res.status(200).send({
                success:true
            })
        }
    );
})




//=================================
//              SITE
//=================================

app.get('/api/site/site_data',(req,res)=>{
    Site.find({},(err,site)=>{
        if(err) return res.status(400).send(err);
        res.status(200).send(site[0].siteInfo)
    });
});


app.post('/api/site/site_data',auth,admin,(req,res)=>{
    Site.findOneAndUpdate(
        { name: 'Site'},
        { "$set": { siteInfo: req.body }},
        { new: true },
        (err,doc )=>{
            if(err) return res.json({success:false,err});
            return res.status(200).send({
                success: true,
                siteInfo: doc.siteInfo
            })
        }
    )
})







// Run server
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Server running at ${port}`)
})