const mongoose = require('mongoose');

const connectDb = async () =>  {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log(`DB connected successfull on ${mongoose.connection.host}`)
    }catch (err) {
        console.log(`An error occured while connecting databse : ${err}`);
    } 
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

module.exports = connectDb;