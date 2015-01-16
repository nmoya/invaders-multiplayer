(function() {

	socket = io.connect("/");

	Players = [];
	my_id = null;
	invaders = null;
	GameState = [];
	Aliens = [];
	socket.on('connect', function() {
		my_id = socket.io.engine.id;
		invaders = new InvadersGame();

		socket.on('disconnection', function(id) {
			invaders.killPlayer(id);
		});

		socket.on('bc_refresh', function(gs) {
			GameState = gs;
			invaders.scoreUpdate(GameState.score);
		});

		socket.on("bc_enemies", function(enem) {
			Aliens = enem;
		});

		socket.on('bc_bullet', function(bullet) {
			if (bullet.id != my_id)
				invaders.insertBulletFromOtherPlayer(bullet);
		});
	});


})();