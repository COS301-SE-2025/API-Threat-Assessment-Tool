const net = require('net');

const HOST = '127.0.0.1';
const PORT = 9000;

const request = {
  command: "connection.test"
};

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  console.log(`[+] Connected to daemon at ${HOST}:${PORT}`);
  client.write(JSON.stringify(request));
  client.end();
});

client.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    const message = response?.data?.message ?? "No message in response";
    console.log(`[✓] Daemon Response: ${message}`);
  } catch (err) {
    console.error(`[x] Failed to parse response:`, err);
  } finally {
    client.destroy(); // close connection
  }
});

client.on('error', (err) => {
  console.error(`[x] Connection error:`, err.message);
});

client.on('close', () => {
  console.log(`[~] Connection closed.`);
});
