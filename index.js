const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Initialize the database connection without specifying the database
const db = mysql.createConnection({
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT
});

db.connect((err) => {
    if (err) {
        return console.error("ERROR", err.message);
    }
    console.log('Connected to the MySQL server.');

    // Create the database if it doesn't exist
    const createDbQuery = `CREATE DATABASE IF NOT EXISTS ${process.env.RDS_DB_NAME}`;
    db.query(createDbQuery, (err, result) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Database created or already exists.');

        // Switch to the database
        db.changeUser({database : process.env.RDS_DB_NAME}, function(err) {
            if (err) {
                console.log('error in changing database', err);
                return;
            }

            // Create the tickets table if it doesn't exist
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS tickets(
                id INT AUTO_INCREMENT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                description TEXT NOT NULL,
                date DATE NOT NULL,
                time TIME NOT NULL,
                status ENUM('new', 'in progress', 'resolved') NOT NULL DEFAULT 'new'
                )
            `;
            db.query(createTableQuery, (err, result) => {
                if (err) {
                    return console.error(err.message);
                }
                console.log('Tickets table created or already exists.');
            });
        });
    });
});


app.post('/tickets', (req, res) => {
  const { name, email, description } = req.body;
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Add the ticket to the database
  const query = 'INSERT INTO tickets(name, email, description, date, time, status) VALUES(?, ?, ?, ?, ?, ?)';
  db.query(query, [name, email, description, date, date, 'new'], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(`A row has been inserted with ID: ${result.insertId}`);
  });

  res.status(200).send({ message: 'Ticket received' });
});

app.get('/tickets', (req, res) => {
    // Fetch all tickets from the database
    const query = 'SELECT * FROM tickets';
    db.query(query, (err, tickets) => {
      if (err) {
        return console.error(err.message);
      }
      // Send the tickets as a JSON response
      res.status(200).json(tickets);
    });
  });
  

app.listen(3000, () => console.log('Server listening on port 3000'));
