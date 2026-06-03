const https = require('https');

https.get('https://m.mobilelegends.com/en/hero', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const urls = data.match(/https:\/\/[^\s\"\'\>]+/g);
    if (urls) {
        console.log("Found:", urls.find(u => u.toLowerCase().includes('hero') && u.endsWith('.png') || u.endsWith('.webp') || u.endsWith('.jpg')));
    }
  });
});
