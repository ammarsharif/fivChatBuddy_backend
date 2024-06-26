const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const profileRoutes = require('./routes/profile');
const subscriptionRoutes = require('./routes/subscription');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

connectDB();

app.use('/api/profile', profileRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
