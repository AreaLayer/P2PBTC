const express = require('express');
const bodyParser = require('body-parser');
const { lnd } = require('ln-service');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/createInvoice', async (req, res) => {
  try {
    const { description, amount } = req.body;
    const invoice = await lnd.createInvoice({ description, tokens: amount });
    res.json({ invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

