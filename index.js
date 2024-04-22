import express from 'express';
import session from 'express-session';
import { open } from "sqlite";
import sqlite3 from 'sqlite3'
import bcrypt from 'bcrypt'

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

// http://localhost:3000/home
app.get('/home', async function (req, res) {
  // If the user is loggedin
  if (req.session.loggedin) {
    const db = await dbPromise;
    // send variables
    const workouts = await db.all(`select * from workouts;`);
    const workName = await db.all(`select workoutName from workouts;`);
    
    console.log(workouts)

    // Output username
    const user = req.session.email;
    res.render('home', {user, workouts, workName}); 
  } else {
    // Not logged in
    res.send('Please login to view this page!');
  }

});

app.get('/workouts', function (req, res) {
  // res.render('workouts');
});

app.post('/workouts', async (req, res) => {
  res.render('workouts');
  const data = req.body;
  console.log(data);
});

app.get("/logout", async (req, res) => {

  req.session.loggedin = false;
  req.session.username = '';

  res.redirect("/")
})
