const https = require('https');

const options = {
  hostname: 'auto-parts-catalog.p.rapidapi.com',
  path: '/articles/search-by-article-no?langId=4&articleNo=C%202029',
  method: 'GET',
  headers: {
    'x-rapidapi-host': 'auto-parts-catalog.p.rapidapi.com',
    'x-rapidapi-key': 'd6cc296d32mshdf55da512f1a00fp15bd5bjsnd3c6e5439b8d',
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
