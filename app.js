// ==== app.js ====
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());
connectDB();

app.get('/', (req, res) => res.send('API Running'));
app.use('/api', require('./routes/auth'));
app.use('/api/persons', require('./routes/person'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));