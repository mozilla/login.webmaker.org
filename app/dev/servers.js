#!/usr/local/bin/node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var express = require('express');

var app1 = express();
var app2 = express();
 
// Configuration
function configure(app){
  app.configure(function(){
    // app.use(express.bodyParser());
    // app.use(express.methodOverride());
    // // app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });
}

configure(app1);
configure(app2);

app1.listen(3001);
app2.listen(3002);


// Routes
// app.get('/', function(req, res){
//   res.render('index', {
//     title: 'Home'
//   });
// });

// app.get('/about', function(req, res){
//   res.render('about', {
//     title: 'About'
//   });
// });

// app.get('/contact', function(req, res){
//   res.render('contact', {
//     title: 'Contact'
//   });
// });

// Only listen on $ node app.js
