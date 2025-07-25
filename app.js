const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get('/', (req, res) => {
    //res.send('Hello there !')
    res.render('temp');
})

app.listen(3030, () => {
    console.log("Listening on port 3030");
})