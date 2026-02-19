const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

const SECRET_KEY = "szupertitkoskulcs"; 

const path = require('path');

app.set('views', path.join(__dirname, '../frontend', 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '../frontend', 'public')));

app.get('/', async (req, res) => {
    res.render('index');
});




app.listen(26052, () => console.log('Szerver fut: http://localhost:26052'));