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
  let sql1 = 'SELECT SUM(Amount) AS TotalItemsOrdered FROM ordersdb';

  let query1= mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1){
    // res.render('index.ejs',{
    //   orders:rows
    // });
    console.log('Fetched total amount from ordersdb')
    total_sales = rows1
    console.log(typeof(rows1))

    let sql2 = 'SELECT COUNT(ItemID) AS NumberOfProducts FROM ordersdb';

    let query2= mysqlConnection.query(sql2, (err2, rows2, fields2)=>{
      if(!err2){
      // res.render('index.ejs',{
      //   orders:rows
      // });
      ord_num = rows2
      console.log('Fetched total no. of orders from ordersdb')

      let sql3 = 'SELECT COUNT(ItemID) AS NumberOfProducts FROM stockdb';

      let query3= mysqlConnection.query(sql3, (err3, rows3, fields3)=>{
      if(!err3){
      // res.render('index.ejs',{
      //   orders:rows
      // });
      console.log('Fetched total no. of stocks from stockdb')
      stock_num = rows3

      let sql4 = 'SELECT SUM(Amount) AS TotalItemsOrdered FROM stockdb';
      let query4= mysqlConnection.query(sql4, (err4, rows4, fields4)=>{
        if(!err3){
          total_stock = rows4
          res.render('index.ejs',{
            total_sales:rows1,
            ord_num:rows2,
            stock_num:rows3,
            total_stock:rows4
            });
        }
        else
        console.log(err4);
     
      });
    }
    else
    console.log(err3);
  });

      }
      else
      console.log(err2);
    });


    }
    else
    console.log(err1);
  });
  // res.render('index.ejs', { name: req.user.name })

 

  
  
})


app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

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

app.listen(port, ()=>console.log(`Express Server is running at ${port} port`))



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
  // Here, you would handle the password reset logic, such as sending an email with a reset link
  const { email } = req.body;
  
  // For this example, let's just send a response indicating that the email was sent for password reset
  res.send('Password reset email sent to ' + email);
});


//CARZ HUB ROUTES

//Billing
app.get('/billing',checkAuthenticated, (req, res) => {
  let sql1 = 'SELECT * FROM categorydb'
  
  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1)
    {
      var category = rows1
      let sql2 = 'SELECT * FROM branddb'
      let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2)=>{
        if(!err2)
        {
          var brand = rows2
          let sql3 = 'SELECT * FROM sizedb'
          let query3 = mysqlConnection.query(sql3, (err3, rows3, fields3)=>{
            if(!err3)
            {
              var size = rows3
              console.log(typeof(category))
              console.log(category)
              console.log(brand)
              console.log(size)
              res.render('bill.ejs',{category:category, brand:brand, size:size})
            }
            else
            console.log(err3)
          })
        }
        else
        console.log(err2)
      })
    }
    else
    console.log(err1)

  
})
})

// View Attendance route
app.get('/attendance', checkAuthenticated, (req, res) => {
  // Fetch data from the database
  let sql1 = 'SELECT * FROM categorydb'
  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1)
    {
      var category = rows1
      res.render('attendance.ejs', {category:category})
    }
    else
    console.log(err1)
  });
});

// View Attendance route
app.get('/records', checkAuthenticated, (req, res) => {
  // Fetch data from the database
  let sql1 = 'SELECT * FROM categorydb'
  let query1 = mysqlConnection.query(sql1, (err1, rows1, fields1)=>{
    if(!err1)
    {
      var category = rows1
      res.render('records.ejs', {category:category})
    }
    else
    console.log(err1)
  });
});


//View Walking Customer
app.get('/walking', checkAuthenticated,(req, res) => {
  let sql2 = 'SELECT * FROM branddb'
  let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2)=>{
    if(!err2)
    {
      var brand = rows2
      res.render('walking.ejs',{brand:brand})
    }
    else
    console.log(err2)
})
})

//Delete Walking Customer
app.post('/deletebrand', checkAuthenticated,(req,res) => {
  console.log('deletebrand called')
  var deleteid = req.body.deleteid
  let sql = 'DELETE FROM branddb WHERE Brand = ?'
  let query = mysqlConnection.query(sql,[ deleteid], (err, rows, fields)=>{
    if(!err)
    {
    console.log('Successfully deleted a brand')
    res.redirect('/walking')
    
    }
    else
    console.log(err);
  });
})

//View vvip Customer
app.get('/vvip', checkAuthenticated,(req, res) => {
  let sql2 = 'SELECT * FROM branddb'
  let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2)=>{
    if(!err2)
    {
      var brand = rows2
      res.render('vvip.ejs',{brand:brand})
    }
    else
    console.log(err2)
})
})

//View membership Customer
app.get('/membership', checkAuthenticated,(req, res) => {
  let sql2 = 'SELECT * FROM branddb'
  let query2 = mysqlConnection.query(sql2, (err2, rows2, fields2)=>{
    if(!err2)
    {
      var brand = rows2
      res.render('membership.ejs',{brand:brand})
    }
    else
    console.log(err2)
})
})
