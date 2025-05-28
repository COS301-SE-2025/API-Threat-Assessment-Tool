const express = require('express');
const app = express();
const port = 5252;

app.use((req, res) => {
  res.status(200).send('API online');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
