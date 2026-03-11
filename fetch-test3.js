import https from 'https';

const endpoints = [
  '/articles/6159438/complete',
  '/articles/6159438/details',
  '/articles/complete/6159438',
  '/articles/details/6159438',
  '/articles/v2/6159438',
  '/vehicles?articleId=6159438',
  '/articles?articleId=6159438&includeAll=true',
  '/articles/search-by-article-no?articleNo=C%202029&includeVehicles=true',
  '/articles/6159438/applications',
  '/articles/6159438/compatibility',
  '/articles/6159438/linked-vehicles' // we know this is 404
];

endpoints.forEach(path => {
  const req = https.request({
    hostname: 'auto-parts-catalog.p.rapidapi.com',
    path: path,
    method: 'GET',
    headers: {
      'x-rapidapi-host': 'auto-parts-catalog.p.rapidapi.com',
      'x-rapidapi-key': 'd6cc296d32mshdf55da512f1a00fp15bd5bjsnd3c6e5439b8d',
      'Accept': 'application/json'
    }
  }, (res) => {
    if (res.statusCode === 200) {
      console.log(`SUCCESS [${res.statusCode}]: ${path}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => console.log(data.substring(0, 300)));
    } else {
      // console.log(`FAIL [${res.statusCode}]: ${path}`);
    }
  });
  req.on('error', () => {});
  req.end();
});
