const https = require('https');

https.get('https://m.mobilelegends.com/en/hero', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/https:\/\/[^\s\"\'\>]+zhuxin[^\s\"\'\>]+/i);
    console.log(match ? match[0] : 'not found');
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
