var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var config = require('./config.json');

if (config.no_reverse_proxy) app.use(express.static('build'));

io.on('connection', function(socket){
	socket.on('login', function(name){
		var msg = name + ' has logged in!';
		console.log(msg);
		socket.broadcast.emit('chat message', msg);
	});
	socket.on('chat message', function(msg, sndr){
		console.log(sndr + ': ' + msg);
		socket.broadcast.emit('chat message', msg, sndr);
	});
});

http.listen(process.argv[2]);