import https from 'https';

const options = {
  hostname: 'auto-parts-catalog.p.rapidapi.com',
  path: '/swagger.json',
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
    console.log('Result for swagger:', data.substring(0, 500));
  });
});
req.end();
