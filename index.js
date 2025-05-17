// const express = require('express');
// const axios = require('axios');

// const app = express();
// app.use(express.json());

// const client = axios.create({
//   baseURL: 'http://127.0.0.1:18443',
//   auth: {
//     username: 'bitcoinuser',  // update to your rpcuser
//     password: 'securepassword' // update to your rpcpassword
//   }
// });

// // Generic RPC call function with optional walletName
// async function callRpc(method, params = [], walletName = '') {
//   const url = walletName ? `/wallet/${walletName}` : '/';
//   const data = {
//     jsonrpc: '1.0',
//     id: 'curltest',
//     method,
//     params
//   };
//   const response = await client.post(url, data);
//   return response.data.result;
// }

// // Create a new wallet
// app.post('/create-wallet', async (req, res) => {
//   const { walletName } = req.body;
//   if (!walletName) return res.status(400).json({ error: 'walletName is required' });

//   try {
//     const result = await callRpc('createwallet', [walletName]);
//     res.json({ success: true, wallet: result });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Generate a new address from a specific wallet
// app.post('/generate-address', async (req, res) => {
//   const { walletName } = req.body;
//   if (!walletName) return res.status(400).json({ error: 'walletName is required' });

//   try {
//     const address = await callRpc('getnewaddress', [], walletName);
//     res.json({ address });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Get wallet balance
// app.get('/balance', async (req, res) => {
//   const walletName = req.query.walletName || '';
//   try {
//     const balance = await callRpc('getbalance', [], walletName);
//     res.json({ balance });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // List wallet transactions
// app.get('/transactions', async (req, res) => {
//   const walletName = req.query.walletName || '';
//   try {
//     const transactions = await callRpc('listtransactions', [], walletName);
//     res.json({ transactions });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Create unsigned PSBT for offline signing
// app.post('/create-tx', async (req, res) => {
//   const { walletName, outputs } = req.body;
//   if (!walletName || !outputs || !Array.isArray(outputs)) {
//     return res.status(400).json({ error: 'walletName and outputs array are required' });
//   }

//   try {
//     const outputsObj = {};
//     for (const o of outputs) {
//       outputsObj[o.address] = o.amount;
//     }
//     const psbt = await callRpc('walletcreatefundedpsbt', [[], outputsObj, 0, { includeWatching: true }], walletName);
//     res.json({ psbt: psbt.psbt });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Sign PSBT
// app.post('/sign-tx', async (req, res) => {
//   const { walletName, psbt } = req.body;
//   if (!walletName || !psbt) return res.status(400).json({ error: 'walletName and psbt are required' });

//   try {
//     const signed = await callRpc('walletprocesspsbt', [psbt], walletName);
//     res.json(signed);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Broadcast signed transaction
// app.post('/broadcast-tx', async (req, res) => {
//   const { hex } = req.body;
//   if (!hex) return res.status(400).json({ error: 'hex is required' });

//   try {
//     const txid = await callRpc('sendrawtransaction', [hex]);
//     res.json({ txid });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 3001;
// app.listen(PORT, () => {
//   console.log(`Bitcoin backend running on http://localhost:${PORT}`);
// });



const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

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

// Generate new address from a wallet
app.get('/generate-address/:wallet', async (req, res) => {
  const wallet = req.params.wallet;
  try {
    const address = await callRpc('getnewaddress', [], wallet);
    res.json({ address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get balance
app.get('/get-balance/:wallet', async (req, res) => {
  const wallet = req.params.wallet;
  try {
    const balance = await callRpc('getbalance', [], wallet);
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List transactions
app.get('/list-tx/:wallet', async (req, res) => {
  const wallet = req.params.wallet;
  try {
    const txs = await callRpc('listtransactions', [], wallet);
    res.json({ transactions: txs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send BTC from a wallet to an address
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


// Create PSBT transaction
app.post('/create-tx', async (req, res) => {
  const { walletName, outputs } = req.body;
  try {
    const psbt = await callRpc('walletcreatefundedpsbt', [[], outputs], walletName);
    res.json({ psbt });
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

// Finalize and broadcast
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
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Bitcoin backend running on http://localhost:${PORT}`);
});





// This are the command i have

// LOAD WALLET
//  bitcoin-cli -regtest listwallets



// CREATE WALLET
// bitcoin-cli -regtest createwallet anyone


// GETNEWADDRESS
// bitcoin-cli -regtest -rpcwallet=anyone getnewaddress


// GETBALANCE
// bitcoin-cli -regtest -rpcwallet=anyone getbalance


// MINE COINS
// bitcoin-cli -regtest generatetoaddress 101 bcrt1qp4hwhnk8pclgjrmn3t37s45e2qvxlkq28qpvvp


// SEND COINS
// curl -X POST http://localhost:3001/send-to-address -H "Content-Type: application/json" -d '{"walletName":"oyin","address":"bcrt1qp4hwhnk8pclgjrmn3t37s45e2qvxlkq28qpvvp","amount":0.5}'


