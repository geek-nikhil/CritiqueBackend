const express = require('express');
const app = express();
const db = require('./db');
const port = 3000;
const user = require('./Routes/user');
const cors = require('cors');
const Categories = require('./Routes/Categories');
app.use(cors());

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use('/user', user);
app.use('/categories' , Categories)
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});


