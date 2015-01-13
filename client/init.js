(function() {

	var socket = null;

	socket = io.connect("/");

	socket.on('players', function(data) {
		$("playing").html("Playing (" + data.num + ")");
	});

	$(document).ready(function() {
		console.log("ready");
		invaders();
	});

})();