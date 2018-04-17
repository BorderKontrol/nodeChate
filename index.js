var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieNode = require('cookie');
var cookieParser = require('cookie-parser');
var nosql = require('nosql');
var FastRateLimit = require("fast-ratelimit").FastRateLimit;
var crypto = require('crypto');
var config = require('./config.json');
var userdb = nosql.load(config.userdb);
var cookiedb = nosql.load(config.cookiedb);
const argon2 = require('@phc/argon2');
const secret = require('./private/key.json').key;

if (config.reverse_proxy) {
	app.set('trust proxy', 'loopback');
}

var messageLimiter = new FastRateLimit({
	threshold : config.message_limit,
	ttl       : 10
});

var queryLimiter = new FastRateLimit({
	threshold : config.query_limit,
	ttl       : 60
});

app.use(cookieParser(secret));

io.on('connection', (socket) => {
	var cookies;
	try {
		var cok = socket.request.headers.cookie;
		cookies = cookieParser.signedCookies(cookieNode.parse(cok), secret);
	}
	catch(err) {
		cookies = null;
	}
	getUserFromCookies(cookies, (err, username) => {
		if (err) socket.disconnect();
		else {
			socket.emit('username', username);
			socket.on('chat message', (msg) => {
				messageLimiter.consume(socket.id).then(() => {
					console.log(username + ': ' + msg);
					socket.broadcast.emit('chat message', msg, username);
				}).catch(() => {
					console.log(cookies.login + ' is spamming');
				});
			});}
		});
});

app.use(express.urlencoded({
	extended: true
}));

app.post('/login', (req, res) => {
	queryLimiter.consume(req.ip).then(() => {
		var username = req.body.username;
		var password = req.body.password;
		userdb.one().make((filter) => {
			filter.where('username', username);
			filter.callback((err, response) => {
				if (err) return res.status(500).send('I am a retard').end();
				if (!response) return res.status(400).send('You are a retard').end();
				argon2.verify(response.password, password).then((bool) => {
					if (!bool) throw new Error('Wrong password.');
					storeCookie(response.username, (err, cookie) => {
						if (err) return res.status(500).send(err).end();
						res.cookie('login', cookie, { expires:  new Date(Date.now() + 604800000), httpOnly: true, secure: config.secure_cookies, signed: true });
						res.redirect('/');
					});
				}).catch(() => {
					res.status(400).send('You are a retard.').end();
				});
			});
		});
	}).catch(() => {
		res.status(429).send('You are sending queries too rapidly.').end();
	});
});

app.post('/register', (req, res) => {
	queryLimiter.consume(req.ip).then(() => {
		argon2.hash(req.body.password).then((hash) => {
			const credentials = {
				"username": req.body.username,
				"password": hash
			}
			userdb.insert(credentials, true).where('username', credentials.username).callback((err, response) => {
				if (err) res.status(500).send('I am a retard');
				else if (response === 0) res.status(400).send('You are a retard');
				else res.redirect('/login.html');
				res.end();
			});
		});
	}).catch(() => {
		res.status(429).send('You are sending queries too rapidly.').end();
	});
});

app.use(express.static('build'));
http.listen(config.port);

function getUserFromCookies(cookies, callback) {
	if (!cookies) return callback(new Error('No cookie'));
	var cookie = cookies.login;
	cookiedb.one().where('cookie', cookie).callback((err, response) => {
		if (err) callback(err);
		if (!response) return callback(new Error('No database entry.'));
		if (response.cookie) return callback(null, response.username);
		return callback(new Error('No user associated with this cookie'));
	});
}

function storeCookie(username, callback) {
	crypto.randomBytes(32, (err, buffer) => {
		if (err) return callback(err);
		var cookie = buffer.toString('hex');
		var pair = {
			"username": username,
			"cookie": cookie
		}
		cookiedb.one().where('cookie', pair.cookie).callback((err, response) => {
			if (err) return callback(err);
			if (response) return callback(new Error('Cookie exists. Please try again.'));
			cookiedb.modify(pair, pair).where('username', username).callback((err, response) => {
				if (err) return callback(err);
				callback(null, pair.cookie);
			});
		});
	});
}