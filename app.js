const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const connectDb = require('./config/connectDB');
const methodOverride = require('method-override');  // Required for PUT & DELETE via POST
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const User = require('./models/user');
const ejsMate = require('ejs-mate')


//config dot env file
dotenv.config();

//connect database
connectDb();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(methodOverride('_method'));              // Enable method override
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// ----- sessions -----
const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URL,
  dbName: 'test',
  crypto: {
    secret: process.env.SESSION_SECRET || 'notagoodsecret'
  },
  touchAfter: 24 * 3600
});

store.on('error', function (e) {
  console.log('SESSION STORE ERROR', e);
});

const sessionConfig = {
  store,
  name: 'toilet.sid',              // custom cookie name
  secret: process.env.SESSION_SECRET || 'notagoodsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
};
app.use(session(sessionConfig));
app.use(flash());

// ----- passport -----
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // from plugin
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// globals for all templates
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

const toiletRoutes = require('./routes/toilets')
app.use('/toilets',toiletRoutes);


const reviewRoutes = require('./routes/reviews');
app.use('/toilets/:id/reviews', reviewRoutes);

app.listen(3000, () => {
    console.log("Listening on port 3000");
})

