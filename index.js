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
    res.redirect("/");
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
    res.redirect("/");
  }
});

app.post('/workouts', async (req, res) => {
  res.render('workouts');
  const data = req.body;
});

app.get('/admin', async function (req, res) {
  if (req.session.loggedin) {
    const user = req.session.email;
    const db = await dbPromise;

    let getUserDetails = `SELECT * FROM users WHERE email = ? AND role = 1`;
    let checkInDb = await db.get(getUserDetails, [user]);
    const query = 'SELECT * FROM users';

    const users = await db.all(query); 

    if (checkInDb === undefined) {
      res.status(400);
      res.send("Invalid user");
    } else {
      req.session.admin = true;
      const admin = req.session.admin;
      res.status(200);
      // user = user mail
      // users = all users
      res.render('admin', { user, admin, users });
    }
  }
});

app.post('/admin', async (req, res) => {
  const db = await dbPromise;
  const username = req.body.username;

  await db.get(`delete from users where username = ?`, username);
  res.redirect('/admin');
});

// Rute for å håndtere GET-forespørsler til '/admin/edit/:id', hvor ':id' er en variabel del av URL-en.
app.get('/admin/edit/:id', async function (req, res) {
  const admin = req.session.admin; // Henter 'admin'-status fra brukerens session.

  if (admin) { // Sjekker om brukeren er admin.
    const db = await dbPromise; // Venter på at databasetilkoblingen skal være klar.
    const id = req.params.id; // Henter brukerens ID fra URL-parameteren.
    const query = `SELECT * FROM users WHERE userId = '${id}'`; // SQL-spørring for å hente brukerdata basert på ID.
    const user = await db.all(query); // Utfører SQL-spørringen og henter brukerdata.

    if (user === undefined) { // Sjekker om brukeren finnes.
      res.status(400);
      res.send("Invalid user"); // Sender feilmelding hvis brukeren ikke finnes.
    } else {
      res.status(200);
      res.render('edit', { user: user[0], admin}); // Sender brukerdata til 'edit' visningen.
    }
  }
  else {
    res.status(400);
    res.send("Not admin"); // Sender feilmelding hvis brukeren ikke er admin.
  }
});

// Rute for å håndtere POST-forespørsler til '/admin/edit/:id'.
app.post('/admin/edit/:id', async function (req, res) {
  const admin = req.session.admin; // Henter 'admin'-status fra session.

  if (admin) { // Sjekker om brukeren er admin.
    const id = req.params.id; // Henter brukerens ID fra URL-parameteren.
    const updateData = req.body; // Henter data som skal oppdateres fra forespørselskroppen.
    const db = await dbPromise; // Venter på at databasetilkoblingen skal være klar.
    const fields = Object.keys(updateData).map(field => `${field} = ?`).join(", "); // Bygger delen av SQL-spørringen som spesifiserer feltene som skal oppdateres.
    const values = Object.values(updateData); // Henter verdiene som skal oppdateres.

    // Legger til bruker-ID til verdilisten for parameterisering
    values.push(id);

    const query = `UPDATE users SET ${fields} WHERE userId = ?`; // Bygger den fulle SQL-spørringen for oppdatering.

    try {
      const result = await db.run(query, values); // Utfører oppdateringen i databasen.
      console.log(result.changes + " record(s) updated"); // Logger antall rader som er oppdatert.
      res.redirect('/admin'); // Omdirigerer brukeren tilbake til admin-siden.
    } catch (error) {
      console.error('Error when updating:', error); // Logger eventuelle feil under oppdatering.
    }
  }
  else {
    res.status(400);
    res.send("Not authorized"); // Sender feilmelding hvis brukeren ikke er admin.
  }
});

app.get("/logout", async (req, res) => {
  req.session.loggedin = false;
  req.session.username = '';
  req.session.role = 0; // ADMIN SYSTEM
  res.redirect("/")
})
