$(function () {
	var socket = io();
	var username;
	var txt = document.getElementById('txt');

	document.getElementById('txtform').addEventListener('submit', function(e){
		e.preventDefault();
		var msg = txt.value;
		socket.emit('chat message', msg);
		addMessage(msg, username);
		txt.value = '';
	});

	socket.on('username', function(name){
		username = name;
		addMessage('You (' + username + ') are now logged in!');
	});

	socket.on('disconnect', function(reason){
		if (reason === 'io server disconnect') window.location.replace(window.location.href + 'login.html');
	});

	socket.on('chat message', function(msg, sndr){
		addMessage(msg, sndr);
	});

	function addMessage(msg, sndr) {
		var messages = $('#messages')
		var nameMarkup = $('<h6 class="my-0">').text(sndr);
		var messageMarkup = $('<div class="media-body my-1 mx-2">').text(msg);
		var mediaBodyMarkup = messageMarkup.prepend(nameMarkup);
		var finalMarkup = $('<li class="media my-2 mx-2 rounded small message">').append(mediaBodyMarkup);
		messages.append(finalMarkup);
		messages.scrollTop(messages[0].scrollHeight);
	}
});