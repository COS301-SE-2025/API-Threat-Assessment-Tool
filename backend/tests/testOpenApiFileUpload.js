const fs = require('fs');
const readline = require('readline');
const net = require('net');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = new net.Socket();
const DAEMON_HOST = '127.0.0.1';
const DAEMON_PORT = 9003;

function promptFileUpload() {
  rl.question('Enter the path to your OpenAPI file: ', function (filepath) {
    const filename = path.basename(filepath);
    const destPath = path.join(__dirname, filename);

    fs.copyFile(filepath, destPath, (err) => {
      if (err) {
        console.error('[x] Failed to copy file:', err.message);
        rl.close();
        return;
      }

      console.log('[✓] File uploaded locally as:', filename);
      const command = {
        command: 'apis.import_file',
        data: { file: filename }
      };

      client.connect(DAEMON_PORT, DAEMON_HOST, () => {
        console.log('[+] Connected to daemon at ' + DAEMON_HOST + ':' + DAEMON_PORT);
        client.write(JSON.stringify(command));
        client.end();
      });
    });
  });
}

client.on('data', (data) => {
  try {
    const res = JSON.parse(data.toString());
    console.log('[✓] Response:', res);
    if (res.data && res.data.message) {
      console.log('[Message]', res.data.message);
    }
  } catch (err) {
    console.error('[x] Invalid response from daemon:', err);
  }
  client.destroy();
  rl.close();
});

client.on('error', (err) => {
  console.error('[x] Connection error:', err.message);
  rl.close();
});

promptFileUpload();
