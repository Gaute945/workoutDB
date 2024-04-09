const sqlite3 = require('sqlite3');
const express = require('express');
const app = express();
const port = 3000;

// Serve the HTML page
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(__dirname + '/index.html');
});

// Execute index.js code
app.get('/run-index', (req, res) => {
    // Open a database connection
    const db = new sqlite3.Database('brukarSystem.db');

    // Insert data into the table
    db.run(`INSERT INTO users (username, email, password) VALUES ('john_doe', 'john_doe@example.com', 'password_john_doe')`, function(err) {
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

    // Close the database connection after all database operations are finished
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Database connection closed.');
    });

    // Send response after all database operations are finished
    res.send('index.js code executed');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});

