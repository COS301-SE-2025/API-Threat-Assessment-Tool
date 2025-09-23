//echo '{"command":"connection.test","data":{}}' | nc localhost 9011
const WebSocket = require('ws');
const net = require('net');

const wss = new WebSocket.Server({ port: 7777 });
const ENGINE_HOST = 'localhost';
const ENGINE_PORT = 9011;

wss.on('listening', () => {
  console.log('WebSocket server started on port 8080');
});

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    const tcpClient = new net.Socket();
    
    tcpClient.connect(ENGINE_PORT, ENGINE_HOST, () => {
        console.log('Connected to engine');
        
        ws.on('message', (message) => {
            // Convert to string if needed
            const strMessage = typeof message === 'string' ? message : message.toString();
            console.log(`Forwarding to engine: ${strMessage}`);
            
            // Forward to engine
            tcpClient.write(strMessage);
        });
    });

    tcpClient.on('data', (data) => {
        console.log(`Received from engine: ${data.toString()}`);
        // Forward engine data to WebSocket client
        ws.send(data.toString());
    });

    tcpClient.on('close', () => {
        console.log('Engine connection closed');
        ws.close();
    });

    tcpClient.on('error', (err) => {
        console.error('Engine connection error:', err);
        ws.close();
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        tcpClient.end();
    });
    
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        tcpClient.end();
    });
    
    // Send ping every 5 seconds to keep connection alive
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, 5000);
    
    ws.on('close', () => clearInterval(pingInterval));
});