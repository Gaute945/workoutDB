import express from 'express';
import session from 'express-session';
import { open } from "sqlite";
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const dbPromise = open({
  filename: 'brukarSystem.db',
  driver: sqlite3.Database
});

const app = express();
const port = 3000;

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Routes will be added here
app.listen(port, () => {
  console.log(`Server er startet her: http://localhost:${port}`);
});

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/user', async function (req, res) {
  // If the user is loggedin
  if (req.session.loggedin) {
    const db = await dbPromise;
    // send variables
    const queryUser = await db.all('SELECT * FROM users WHERE email = ?', req.session.email);
    
    // Output username
    const user = req.session.email;
    const role = req.session.role; 

    res.render('user', {user, queryUser, role});
  } else {
    // Not logged in
    res.send('Please login to view this page!');
  }
});

app.get("/register", async (req, res) => {
  res.render("register");
})

app.post("/register", async (req, res) => {
  const db = await dbPromise;

  const { fname, lname, email, password, passwordRepeat } = req.body;

  if (password != passwordRepeat) {
    res.render("register", { error: "Password must match." })
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", fname, email, passwordHash);
  res.redirect("/");
})

app.post('/auth', async function (req, res) {

  const db = await dbPromise;

  const { email, password } = req.body;
  let getUserDetails = `SELECT * FROM users WHERE email = '${email}'`;
  let checkInDb = await db.get(getUserDetails);
  if (checkInDb === undefined) {
    res.status(400);
    res.send("Invalid user" + getUserDetails);
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      checkInDb.password
    );

    if (isPasswordMatched) {
      res.status(200);
      if (checkInDb.role == 1) {
        req.session.role = true;
      }
      // If the account exists
      // Authenticate the user
      req.session.loggedin = true;
      req.session.email = email;
      // Redirect to home page
      res.redirect('/home');
    } else {
      res.status(400);
      res.send("Invalid password");
      res.redirect("/");
    }
  }
});

app.get('/home', async function (req, res) {
  // If the user is loggedin
  if (req.session.loggedin) {
    const db = await dbPromise;
    // send variables
    const workouts = await db.all(`select * from workouts;`);
    const workName = await db.all(`select workoutName from workouts;`);

    // Output username
    const user = req.session.email;
    const role = req.session.role; 

    res.render('home', {user, workouts, workName, role});
  } else {
    // Not logged in
    res.send('Please login to view this page!');
  }
});

app.post('/home', async (req, res) => {
  console.log(req);
});

app.post('/workouts', async (req, res) => {
  res.render('workouts');
  const data = req.body;
});

app.get('/admin', async function (req, res) {
  if (req.session.loggedin) {
    const user = req.session.email;
    const db = await dbPromise;
    const query = 'SELECT * FROM users';
    const users = await db.all(query);

    let getUserDetails = `SELECT * FROM users WHERE email = '${user}' AND role = 1`;
    let checkInDb = await db.get(getUserDetails);

    if (checkInDb === undefined) {
      res.status(400);
      res.send("Invalid user");
    } else {
      let admin = false;
      res.status(200);
      res.render('admin', {user, admin, users});
    }
  }
});

app.post('/admin', async (req, res) => {
  const db = await dbPromise;
  const username = req.body.username;
  
  await db.get(`delete from users where username = '${username}'`);
  res.redirect('/admin');
  console.log(req.body);
});

app.get("/logout", async (req, res) => {
  req.session.loggedin = false;
  req.session.username = '';
  req.session.role = 0; // ADMIN SYSTEM
  res.redirect("/")
})
