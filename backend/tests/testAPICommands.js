const fs = require('fs');
const net = require('net');
const path = require('path');

const FILE_NAME = 'OpenAPISimpleTest.json';
const FILE_PATH = path.join(__dirname, FILE_NAME);
const DEST_PATH = path.join(__dirname, FILE_NAME);

const DAEMON_HOST = '127.0.0.1';
const DAEMON_PORT = 9011;

let clientId = null;
let endpointId = null;

function sendCommand(command, data, label) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let responseData = "";

    client.connect(DAEMON_PORT, DAEMON_HOST, () => {
      console.log(`\n[→] ${label}`);
      client.write(JSON.stringify({ command, data }) + '\n');
      client.end();
    });

    client.on('data', (chunk) => {
      responseData += chunk.toString();
    });

    client.on('end', () => {
      try {
        const response = JSON.parse(responseData);
        console.log(`[✓] ${label} Response:`, response);

        if (command === 'apis.import_file' && response.data) {
          clientId = response.data.client_id;
        }

        if (command === 'endpoints.list' && response.data?.endpoints?.length > 0) {
          endpointId = response.data.endpoints[0].id;
          console.log(`[✓] Found Endpoint ID: ${endpointId}`);
        }

        resolve();
      } catch (e) {
        console.error('[x] Failed to parse response:', e);
        reject(e);
      }
    });

    client.on('error', (err) => {
      console.error(`[x] ${label} Error:`, err.message);
      reject(err);
    });
  });
}

async function runTest() {
  try {
    fs.copyFileSync(FILE_PATH, DEST_PATH);
    console.log(`[✓] File copied to backend/Files as ${FILE_NAME}`);

    await sendCommand('apis.import_file', { file: FILE_NAME }, 'Import OpenAPI File');

    if (!clientId) throw new Error('Client ID not returned');

    await sendCommand('apis.details', { client_id: clientId }, 'Get API Details');

    await sendCommand('endpoints.list', { client_id: clientId }, 'List Endpoints');

    if (!endpointId) throw new Error('No endpoint ID found');

    await sendCommand('endpoints.details', {
      client_id: clientId,
      id: endpointId,
      path: '/users',
      method: 'GET'
    }, 'Get Endpoint Details');

    await sendCommand('endpoints.tags.add', {
      client_id: clientId,
      path: '/users',
      method: 'GET',
      tags: ['alpha', 'user-api']
    }, 'Add Tags to Endpoint');

    await sendCommand('endpoints.tags.remove', {
      client_id: clientId,
      path: '/users',
      method: 'GET',
      tags: ['alpha']
    }, 'Remove Tag from Endpoint');

    await sendCommand('endpoints.tags.replace', {
      client_id: clientId,
      path: '/users',
      method: 'GET',
      tags: ['production']
    }, 'Replace Tags on Endpoint');

    await sendCommand('tags.list', {}, 'Get All Tags');

    await sendCommand('apis.update', {
      client_id: clientId,
      updates: { title: 'Updated Sample API', version: '1.0.0' }
    }, 'Update API');

    await sendCommand('apis.delete', { client_id: clientId }, 'Delete API');

    console.log('\n[✓] All tests completed.');

  } catch (err) {
    console.error('[x] Test failed:', err.message);
  }
}

runTest();
