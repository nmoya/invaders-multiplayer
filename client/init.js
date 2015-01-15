(function() {

	socket = io.connect("/");

	players = []
	my_id = null;
	invaders = null;
	GameState = [];
	socket.on('connect', function() {
		my_id = socket.io.engine.id;
		invaders = new InvadersGame();

		socket.on('disconnection', function(id) {
			invaders.killPlayer(id);
		});

		socket.on('refresh', function(gs) {
			GameState = gs;
		});

	});


})();