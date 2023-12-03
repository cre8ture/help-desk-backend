const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();
const async = require('async');

const app = express();
app.use(express.static('public'));

app.use(cors());
app.use(express.json());


// Initialize the database connection pool
const pool = mysql.createPool({
  connectionLimit: 10, // Maximum number of connections in pool
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT,
  // database: process.env.RDS_DB_NAME // Add the database name here
});

pool.query('SELECT 1', (err, results) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');

  const dbname = "databasehelpdesk";//process.env.RDS_DB_NAME;

  // Proceed with the async series of queries
  async.series([
    function clear(callback) {
      pool.query(`DROP DATABASE IF EXISTS \`${dbname}\``, callback);
    },
    function create_db(callback) {
      pool.query(`CREATE DATABASE \`${dbname}\``, callback);
    },
    function use_db(callback) {
      pool.query(`USE \`${dbname}\``, callback);
    },
    function create_table(callback) {
      const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tickets(
        id INT AUTO_INCREMENT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        description TEXT NOT NULL,
        date DATETIME NOT NULL,
        status ENUM('new', 'in progress', 'resolved') NOT NULL DEFAULT 'new',
        response_name TEXT,
        response_response TEXT,
        dateResponded DATETIME
    );
    
    `;
    
    

        pool.query(createTableQuery, callback);
    },
    // addDateRespondedColumn,
  ], (err, results) => {
    if (err) {
      console.error('Exception initializing database:', err);
    } else {
      console.log('Database initialization complete.');
      // Initialize your server here if necessary
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

  app.post('/tickets', (req, res) => {
    const { name, email, description, response_name, response_response } = req.body;
    const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
    const query = 'INSERT INTO tickets(name, email, description, date, status, response_name, response_response) VALUES(?, ?, ?, ?, ?, ?, ?)';
    pool.query(query, [name, email, description, dateTime, 'new', response_name, response_response], (err, result) => {
  // pool.query(query, [name, email, description, dateTime, dateTime, 'new', response_name, response_response], (err, result) => {

    if (err) {
      console.error(err.message);
      return res.status(500).send({ message: 'Error adding ticket', error: err.message });
    }
    console.log(`A row has been inserted with ID: ${result.insertId}`);
    res.status(200).send({ message: 'Ticket received', insertId: result.insertId });
  });
});

//     app.put('/tickets/:id', (req, res) => {
//       const { id } = req.params;
//       const fieldsToUpdate = req.body;
//       const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
    
//       const setClause = Object.keys(fieldsToUpdate)
//         .map(key => `${key} = ?`)
//         .join(', ');
    
//       // const queryValues = [...Object.values(fieldsToUpdate), dateTime, id];
//       const queryValues = [...Object.values(fieldsToUpdate), dateTime, dateTime, id];


    
//       // const query = `UPDATE tickets SET ${setClause}, dateResponded = ? WHERE id = ?`;
//       const query = `USE \`${dbname}\`; UPDATE tickets SET ${setClause}, dateResponded = ? WHERE id = ?`;
    
//       console.log("Executing query:", query);
//       console.log("With values:", queryValues);


//       pool.query(query, queryValues, (err, result) => {
//     if (err) {
//       console.error(err.message, "RES", result);
//       return res.status(500).send({ message: 'Error updating ticket' + err.message });
//     }
//     if (result.affectedRows === 0) {
//       return res.status(404).send({ message: 'Ticket not found' });
//     }
//     console.log(`Ticket with ID: ${id} has been updated`);
//     res.status(200).send({ message: 'Ticket updated successfully' });
//   });
// });

app.put('/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { response_response, response_name } = req.body;
  const dateResponded = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const query = 'UPDATE tickets SET response_response = ?, response_name = ?, dateResponded = ? WHERE id = ?';
  const queryValues = [response_response, response_name, dateResponded, id];

  console.log("Executing query:", query);
  console.log("With values:", queryValues);
  console.log("HERE IS THE MOST UPDATE VERSION 923")

  pool.query(query, queryValues, (err, result) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send({ message: 'Error updating ticket: ' + err.message });
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
  pool.query(query, [id], (err, result) => {
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
  pool.query(query, (err, tickets) => {
    if (err) {
      return console.error(err.message);
    }
    // Send the tickets as a JSON response
    res.status(200).json(tickets);
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  pool.query('SELECT 1', (err, results) => {
    if (err) {
      console.error('Database health check failed:', err);
      return res.status(500).send({ message: 'Database health check failed', error: err.message });
    }
    res.status(200).send({ message: 'Health check passed' });
  });
});



// app.listen(3000, () => console.log('Server listening on port 3000'));
module.exports = app;

