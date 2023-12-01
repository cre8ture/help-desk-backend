const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();
const async = require('async');

const app = express();

app.use(cors());
app.use(express.json());


// Initialize the database connection
const client = mysql.createConnection({
  connectionLimit: 10,
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT
});

// Connect to the database
client.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');

  const dbname = process.env.RDS_DB_NAME;

  // Proceed with the async series of queries
  async.series([
    function clear(callback) {
      client.query('DROP DATABASE IF EXISTS ' + dbname, callback);
    },
    function create_db(callback) {
      client.query('CREATE DATABASE ' + dbname, callback);
    },
    function use_db(callback) {
      client.query('USE ' + dbname, callback);
    },
    function create_table(callback) {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tickets(
          id INT AUTO_INCREMENT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          description TEXT NOT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          status ENUM('new', 'in progress', 'resolved') NOT NULL DEFAULT 'new'
        )`;
      client.query(createTableQuery, callback);
    }
  ], (err, results) => {
    if (err) {
      console.error('Exception initializing database:', err);
    } else {
      console.log('Database initialization complete.');
      // Initialize your server here if necessary
    }
  });
});

app.post('/tickets', (req, res) => {
  const { name, email, description } = req.body;
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Add the ticket to the database
  const query = 'INSERT INTO tickets(name, email, description, date, time, status) VALUES(?, ?, ?, ?, ?, ?)';
  client.query(query, [name, email, description, date, date, 'new'], (err, result) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send({ message: 'Error adding ticket', error: err.message });
    }
    console.log(`A row has been inserted with ID: ${result.insertId}`);
    res.status(200).send({ message: 'Ticket received', insertId: result.insertId });
  });
});

app.put('/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, description, status } = req.body;

  // Update the ticket in the database
  const query = 'UPDATE tickets SET name = ?, email = ?, description = ?, status = ? WHERE id = ?';
  client.query(query, [name, email, description, status, id], (err, result) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send({ message: 'Error updating ticket' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'Ticket not found' });
    }
    console.log(`Ticket with ID: ${id} has been updated`);
    res.status(200).send({ message: 'Ticket updated successfully' });
  });
});


app.delete('/tickets/:id', (req, res) => {
  const { id } = req.params;

  // Delete the ticket from the database
  const query = 'DELETE FROM tickets WHERE id = ?';
  client.query(query, [id], (err, result) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send({ message: 'Error deleting ticket' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'Ticket not found' });
    }
    console.log(`Ticket with ID: ${id} has been deleted`);
    res.status(200).send({ message: 'Ticket deleted successfully' });
  });
});


app.get('/tickets', (req, res) => {
    // Fetch all tickets from the database
    const query = 'SELECT * FROM tickets';
    client.query(query, (err, tickets) => {
      if (err) {
        return console.error(err.message);
      }
      // Send the tickets as a JSON response
      res.status(200).json(tickets);
    });
  });
  

// app.listen(3000, () => console.log('Server listening on port 3000'));
module.exports = app;

