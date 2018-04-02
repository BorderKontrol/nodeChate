$(function () {

	var socket = io();
	var username;

	// username socket logic here soon

	if (!username) {
		addMessage('Pick a username by typing it into the chat box...');
	}

	// This breaks Safari support, fuck
	//Notification.requestPermission().then(function(result) {
	//	console.log(result);
	//});

	$('form').submit(function(){
		if (!username) {
			username = $('#txt').val();
			socket.emit('login', username);
			$('#txt').attr('placeholder', 'Type to chat...');
			$('#txt').val('');
			return false;
		}
		else {
			socket.emit('chat message', $('#txt').val(), username);
			$('#txt').val('');
			return false;
		}
	});

	socket.on('chat message', function(msg, sndr){
		addMessage(msg, sndr);
		spawnNotification(msg, null, sndr);
	});

	function addMessage(msg, sndr) {
		var nameMarkup = '';
		if (sndr) nameMarkup = $('<h6 class="my-0">').text(sndr);
		var messageMarkup = $('<div class="media-body my-1 mx-2">').text(msg);
		var mediaBodyMarkup = messageMarkup.prepend(nameMarkup);
		var finalMarkup = $('<li class="media my-2 mx-2 rounded small message">').append(mediaBodyMarkup);
		$('#messages').append(finalMarkup);
	}

	//function spawnNotification(body, icon, title) {
	//	var options = {
	//		body: body,
	//		icon: icon
	//	};
	//	var n = new Notification(title, options);
	//}
});