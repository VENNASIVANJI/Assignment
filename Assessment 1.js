npx create-react-app google-sheets-clone
cd google-sheets-clone
npm install handsontable react-chartjs-2 chart.js axios
import React, { useState, useEffect } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

const App = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState(10);
  const [rows, setRows] = useState(10);
  const [chartData, setChartData] = useState(null);

  // Initialize the spreadsheet
  useEffect(() => {
    const initialData = Array.from({ length: rows }, () => Array(columns).fill(''));
    setData(initialData);
  }, [rows, columns]);

  // Handle change in data
  const handleChange = (changes) => {
    changes.forEach(([row, col, oldValue, newValue]) => {
      // Send changes to the backend for processing formulas, etc.
      axios.post('/api/update-cell', { row, col, newValue });
    });
  };

  const handleSave = () => {
    axios.post('/api/save-sheet', { data }).then(response => {
      console.log('Sheet saved!');
    });
  };

  const handleLoad = () => {
    axios.get('/api/load-sheet').then(response => {
      setData(response.data);
    });
  };

  // Chart.js Configuration
  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true
      },
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="app-container">
      <h1>Google Sheets Clone</h1>
      <div id="spreadsheet-container">
        <Handsontable
          data={data}
          colHeaders={Array.from({ length: columns }, (_, i) => `Column ${i + 1}`)}
          rowHeaders={Array.from({ length: rows }, (_, i) => `Row ${i + 1}`)}
          width="100%"
          height="400"
          stretchH="all"
          afterChange={handleChange}
          settings={{
            formulas: true, // Enable formula support
            manualColumnResize: true,
            manualRowResize: true,
          }}
        />
      </div>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleLoad}>Load</button>

      {/* Chart.js integration */}
      <div className="chart-container">
        {chartData && <Line data={chartData} options={chartOptions} />}
      </div>
    </div>
  );
};
.app-container {
    text-align: center;
    margin: 20px;
  }
  
  #spreadsheet-container {
    margin: 20px auto;
  }
  
  button {
    margin: 10px;
    padding: 10px;
    cursor: pointer;
  }
  mkdir backend
  cd backend
  npm init -y
  npm install express cors sqlite3 body-parser
  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  const sqlite3 = require('sqlite3').verbose();
  
  const app = express();
  const db = new sqlite3.Database('./spreadsheet.db');
  
  app.use(cors());
  app.use(bodyParser.json());
  
  // API to save the spreadsheet data
  app.post('/api/save-sheet', (req, res) => {
    const { data } = req.body;
    db.serialize(() => {
      db.run('CREATE TABLE IF NOT EXISTS spreadsheet (row INTEGER, col INTEGER, value TEXT)');
      const stmt = db.prepare('INSERT OR REPLACE INTO spreadsheet (row, col, value) VALUES (?, ?, ?)');
      data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          stmt.run(rowIndex, colIndex, cell);
        });
      });
      stmt.finalize();
    });
    res.send('Sheet saved successfully');
  });
  
  // API to load the spreadsheet data
  app.get('/api/load-sheet', (req, res) => {
    const data = [];
    db.all('SELECT * FROM spreadsheet ORDER BY row, col', [], (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach(row => {
        if (!data[row.row]) data[row.row] = [];
        data[row.row][row.col] = row.value;
      });
      res.json(data);
    });
  });
  
  // API to update a cell's value
  app.post('/api/update-cell', (req, res) => {
    const { row, col, newValue } = req.body;
    db.run('INSERT OR REPLACE INTO spreadsheet (row, col, value) VALUES (?, ?, ?)', [row, col, newValue], (err) => {
      if (err) {
        return res.status(500).send('Error updating cell');
      }
      res.send('Cell updated successfully');
    });
  });
  
  // Start the server
  app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
  });
      
  touch spreadsheet.db
