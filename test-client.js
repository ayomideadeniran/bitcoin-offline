// const Client = require('bitcoin-core');

// const client = new Client({
//   network: 'regtest',
//   username: 'bitcoin',
//   password: 'secret',
//   host: '127.0.0.1',
//   port: 18443
// });

// console.log(client);




const axios = require('axios');

const rpcUser = 'bitcoin';
const rpcPassword = 'secret';
const rpcPort = 18443;

const instance = axios.create({
  baseURL: `http://127.0.0.1:${rpcPort}`,
  auth: {
    username: rpcUser,
    password: rpcPassword,
  },
  headers: { 'content-type': 'text/plain' }
});

async function getBalance() {
  const data = {
    jsonrpc: '1.0',
    id: 'curltest',
    method: 'getbalance',
    params: []
  };

  try {
    const response = await instance.post('/', data);
    console.log(response.data);
  } catch (error) {
    console.error('RPC error:', error.response?.data || error.message);
  }
}

getBalance();
