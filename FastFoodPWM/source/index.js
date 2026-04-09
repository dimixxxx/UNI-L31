require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorHandler');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/homepage.html');
});

app.use('/api', authRoutes);

// error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connesso');
    app.use(express.static(path.join(__dirname, 'public')));
    // serve static files from public/homepage.html
    app.listen(PORT, () => console.log(`Server avviato su http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Errore connessione MongoDB:', err);
    process.exit(1);
  });
