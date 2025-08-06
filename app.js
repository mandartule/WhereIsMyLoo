const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const connectDb = require('./config/connectDB');
const methodOverride = require('method-override');  // Required for PUT & DELETE via POST

const toiletRoutes = require('./routes/toilets');


//config dot env file
dotenv.config();

//connect database
connectDb();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(methodOverride('_method'));              // Enable method override
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

app.use((req, res, next) => {
    res.locals.currentUser = null; 
    next();
});

app.get('/', (req, res) => {
    res.render('temp', { currentUser: null }); 
});

app.use('/toilets', toiletRoutes);

app.listen(3000, () => {
    console.log("Listening on port 3000");
})

