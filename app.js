// requirejs
var requirejs = require('requirejs');
requirejs.config({ 
  baseUrl: __dirname + '/javascripts', 
  nodeRequire: require
});
require = requirejs;

// mount index and javascripts
var express = require('express');
var app = express();
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.use('/javascripts', express.static(__dirname + '/javascripts'));

app.listen(process.env.PORT || 3000);
