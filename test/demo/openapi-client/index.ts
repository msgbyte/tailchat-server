import express from 'express';
import path from 'path';
const app = express();
const port = 8080;

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './app.html'));
});

app.get('/cb', (req, res) => {
  console.log(req);
  res.json(req.query);
});

app.listen(port, () => {
  console.log(`Demo app listening on port ${port}`);
});
