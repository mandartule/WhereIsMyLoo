const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const connectDb = require('./config/connectDB');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//config dot env file
dotenv.config();

//connect database
connectDb();
app.use(express.json());

app.get('/', (req, res) => {
    //res.send('Hello there !')
    res.render('temp');
})


app.listen(3030, () => {
    console.log("Listening on port 3030");
})

