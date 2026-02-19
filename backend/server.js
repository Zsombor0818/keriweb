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


const users = [
  {id:1,name:'Admin',email:'admin@test.com',role:'Admin'},
  {id:2,name:'User',email:'user@test.com',role:'Felhasználó'}
];
const articles = [
  {id:1,title:'Első cikk',author:'Admin'},
  {id:2,title:'Második cikk',author:'User'}
];

// Routes
app.get('/admin/dashboard', (req,res)=>{
  res.render('layouts/main', { body: ejs.renderFile('views/dashboard.ejs',{userCount:users.length, articleCount:articles.length}), active:'dashboard' });
});

app.get('/admin/users', (req,res)=>{
  res.render('layouts/main', { body: ejs.renderFile('views/users.ejs',{users:users}), active:'users' });
});

app.get('/admin/articles', (req,res)=>{
  res.render('layouts/main', { body: ejs.renderFile('views/articles.ejs',{articles:articles}), active:'articles' });
});

app.get('/admin/settings', (req,res)=>{
  res.render('layouts/main', { body: ejs.renderFile('views/settings.ejs',{}), active:'settings' });
});

app.listen(26052, () => console.log('Szerver fut: http://localhost:26052'));