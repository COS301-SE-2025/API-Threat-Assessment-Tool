const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5252,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  console.log(`Status Code: ${res.statusCode}`);

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Response: ${data}`);
    if (res.statusCode === 200 && data === 'API online') {
      console.log('API Server is up and responding correctly.');
    } else {
      console.log('API Server did not respond as expected.');
    }
  });
});

req.on('error', (err) => {
  console.error(`Error connecting to API server: ${err.message}`);
});

req.end();
