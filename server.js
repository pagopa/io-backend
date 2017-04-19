const express = require('express');
const app = express();

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.send('Nothing to see here');
});

app.get('/app', function(req, res) {
  res.send('<pre>' + JSON.stringify(req.headers) + '</pre>');
});

var server = app.listen(8080, function() {
    console.log('Listening on port %d', server.address().port);
});
