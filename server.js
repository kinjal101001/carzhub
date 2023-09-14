if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mysql = require('mysql2');
const bodyparser = require('body-parser');
const dotenv = require('dotenv');

var port = process.env.PORT || 7000;
app.use(bodyparser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
})) 
var mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: process.env.db_user_name,
  password: process.env.db_password,
  database: process.env.db_name,
  });


mysqlConnection.connect((err)=>{
  if(!err)
  console.log('DB connection succeeded')
  else
  console.log('DB connection failed \n Error :' + JSON.stringify(err,undefined,2));
})

const users = []

  users.push({
    id: Date.now().toString(),
    name: 'Admin',
    email: process.env.login_id,
    password: process.env.login_password
  })


const initializePassport = require('./passport-config')
const e = require('express')
initializePassport(
  
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)


app.use( express.static( "public" ) )
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
  // Replace this part with the logic you want to execute for authenticated users
  // For now, it's just rendering a placeholder view
  res.render('index.ejs', {
    user: req.user
  });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    console.log(users)
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}




// Route for password reset page
app.get('/forgot-password', (req, res) => {
  res.send(`
    <h1>Reset Password</h1>
    <form action="/reset-password" method="POST">
      <input type="email" name="email" placeholder="Your email address" required>
      <button type="submit">Reset Password</button>
    </form>
  `);
});

// Route for handling password reset submission
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  
  res.send('Password reset email sent to ' + email);
});




//reminder
app.get('/reminder',checkAuthenticated, (req, res) => {
  res.render('reminder.ejs');
})

//Sales Filter
app.get('/sales_filter',checkAuthenticated, (req, res) => {
  res.render('sales_filter.ejs');
})

//View Walking Customer
app.get('/walking', checkAuthenticated, (req, res) => {
  res.render('walking.ejs');
});

//View vvip Customer
app.get('/vvip', checkAuthenticated,(req, res) => {
      res.render('vvip.ejs');
})

//View membership Customer
app.get('/membership', checkAuthenticated,(req, res) => {
      res.render('membership.ejs');
})

// View Attendance route
app.get('/attendance', checkAuthenticated, (req, res) => {
  res.render('attendance.ejs');
});

// View Attendance route
app.get('/records', checkAuthenticated, (req, res) => {
  res.render('records.ejs');
});

app.listen(port, ()=>console.log(`Express Server is running at ${port} port`))
