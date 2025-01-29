
/* NOW
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect("mongodb://localhost:27017/Login-pro");
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
};

const Loginschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    specialization: {
        type: String,
        default: "General"
    },
    phone: {
        type: String,
        required: true
    }
});

const issueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    applianceType: { type: String, required: true },
    brand: { type: String, required: true },
    issue: { type: String, required: true },
    date: { type: Date, required: true },
    contactMethod: { type: String, required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const UserModel = mongoose.model("User", Loginschema);
const IssueModel = mongoose.model("Issue", issueSchema);

module.exports = { UserModel, IssueModel, connectDB };
*/

/*
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect("mongodb://localhost:27017/Login-pro");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
};

const Loginschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email:{
        type:String,
        required:true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    specialization: {
        type: String,
        default: "General"
    },
    phone: {
        type: String,
        default: null
    }



    
});

const issueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    applianceType: { type: String, required: true },
    brand: { type: String, required: true },
    issue: { type: String, required: true },
    date: { type: Date, required: true },
    contactMethod: { type: String, required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const orderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    partsname: { type: String, required: true },  
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now, required: true },
});


const UserModel = mongoose.model("User", Loginschema);
const IssueModel = mongoose.model("Issue", issueSchema);
const OrderModel = mongoose.model("OrderModel", orderSchema);



module.exports = { UserModel, IssueModel,OrderModel, connectDB };
*/


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String,
    role: String,
    rating: Number,
    specialization: String
});

const issueSchema = new mongoose.Schema({
    name: String,
    contactNumber: String,
    email: String,
    applianceType: String,
    brand: String,
    issue: String,
    date: Date,
    contactMethod: String,
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const orderSchema = new mongoose.Schema({
    name: String,
    contactNumber: String,
    partsname: String,
    quantity: Number,
    date: Date,
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const UserModel = mongoose.model('User', userSchema);
const IssueModel = mongoose.model('Issue', issueSchema);
const OrderModel = mongoose.model('Order', orderSchema);

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/yourdb', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
};

module.exports = { UserModel, IssueModel, OrderModel, connectDB };
