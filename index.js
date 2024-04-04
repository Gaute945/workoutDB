const sqlite3 = require('sqlite3').verbose();

// Open a database connection
const db = new sqlite3.Database('mydatabase.db');

// Create a table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    email TEXT
)`);

// Insert data into the table
db.run(`INSERT INTO users (username, email) VALUES (?, ?)`, ['john_doe', 'john@example.com'], function(err) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    }
});

// Query data from the table
db.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) {
        console.error(err.message);
    } else {
        rows.forEach(row => {
            console.log(row);
        });
    }
});

// Update data in the table
db.run(`UPDATE users SET email = ? WHERE id = ?`, ['john_new@example.com', 1], function(err) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(`Row(s) updated: ${this.changes}`);
    }
});

// Delete data from the table
db.run(`DELETE FROM users WHERE id = ?`, [1], function(err) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(`Row(s) deleted: ${this.changes}`);
    }
});

// Close the database connection
db.close();

