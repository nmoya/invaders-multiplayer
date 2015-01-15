(function() {

	socket = io.connect("/");

	players = []
	var GameState = [];
	my_id = null;
	invaders = null;
	socket.on('connect', function() {
		my_id = socket.io.engine.id;
		invaders = new InvadersGame();

		socket.on('disconnection', function(id) {
			players[id].kill();
			delete players[id];
		});

		socket.on('refresh', function(gs) {
			GameState = gs;
		});

	});


})();