const express = require('express');
const axios = require('axios');
const fs = require('fs');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allow requests from your React frontend

const client = axios.create({
  baseURL: 'http://127.0.0.1:18443',
  auth: {
    username: 'bitcoinuser',
    password: 'securepassword'
  }
});

async function callRpc(method, params = [], wallet = null) {
  const url = wallet ? `/wallet/${wallet}` : '/';
  const data = {
    jsonrpc: '1.0',
    id: 'curltest',
    method,
    params
  };
  const response = await client.post(url, data);
  return response.data.result;
}

// Create new wallet
app.post('/create-wallet', async (req, res) => {
  const { walletName } = req.body;
  try {
    const result = await callRpc('createwallet', [walletName]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate address
app.get('/generate-address/:wallet', async (req, res) => {
  try {
    const address = await callRpc('getnewaddress', [], req.params.wallet);
    res.json({ address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get balance
app.get('/get-balance/:wallet', async (req, res) => {
  try {
    const balance = await callRpc('getbalance', [], req.params.wallet);
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List transactions
app.get('/list-tx/:wallet', async (req, res) => {
  try {
    const txs = await callRpc('listtransactions', [], req.params.wallet);
    res.json({ transactions: txs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send coins
app.post('/send-to-address', async (req, res) => {
  const { walletName, address, amount } = req.body;
  if (!walletName || !address || !amount) {
    return res.status(400).json({ error: 'walletName, address and amount are required' });
  }
  try {
    const txid = await callRpc('sendtoaddress', [address, amount], walletName);
    res.json({ txid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create PSBT, save to file, and generate QR
app.post('/create-tx', async (req, res) => {
  const { walletName, outputs } = req.body;
  try {
    const { psbt } = await callRpc('walletcreatefundedpsbt', [[], outputs], walletName);

    const filename = `./psbts/${walletName}_${Date.now()}.psbt`;
    fs.mkdirSync('./psbts', { recursive: true });
    fs.writeFileSync(filename, psbt);

    const qrCode = await QRCode.toDataURL(psbt);

    res.json({ psbt, qrCode, file: filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sign PSBT
app.post('/sign-tx', async (req, res) => {
  const { walletName, psbt } = req.body;
  try {
    const signed = await callRpc('walletprocesspsbt', [psbt], walletName);
    res.json({ signed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// // Finalize and broadcast PSBT
// app.post('/broadcast-tx', async (req, res) => {
//   const { psbt } = req.body;
//   try {
//     const finalized = await callRpc('finalizepsbt', [psbt]);
//     if (finalized.complete) {
//       const txid = await callRpc('sendrawtransaction', [finalized.hex]);
//       res.json({ txid });
//     } else {
//       res.status(400).json({ error: 'PSBT not complete' });
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



app.post('/broadcast-tx', async (req, res) => {
  const { psbt } = req.body;
  try {
    const finalized = await callRpc('finalizepsbt', [psbt]);
    if (finalized.complete) {
      const txid = await callRpc('sendrawtransaction', [finalized.hex]);
      res.json({ txid });
    } else {
      res.status(400).json({ error: 'PSBT not complete' });
    }
  } catch (err) {
    // Log the full error response from Bitcoin Core
    if (err.response && err.response.data) {
      console.error('Broadcast error (Bitcoin Core):', JSON.stringify(err.response.data, null, 2));
      res.status(500).json({ error: err.response.data.error?.message || 'Unknown Bitcoin Core error' });
    } else {
      console.error('Broadcast error (other):', err);
      res.status(500).json({ error: err.message });
    }
  }
});




const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Bitcoin backend running at http://localhost:${PORT}`);
});
