(function() {
	var port = process.env.PORT || 3000;
	var express = require("express");
	var app = express();
	var server = require('http').createServer(app);
	io = require('socket.io')(server);
	var GS = require("./server/game.js");
	clients = 0;


	GameState = {
		uid: 0,
		time: 0,
		score: 0,
		leader: null,
		config: {},
		Enemies: {},
		Bullets: {},
		Users: {},
		level: 0,
		aliveEnemies: 0,
	}

	function init_static() {
		server.listen(port, function() {
			console.log('Server listening at http://localhost:%d', port);
		});
		app.use(express.static(__dirname + '/public'));
		app.get("/", function(req, res) {
			res.sendFile(__dirname + '/index.html')
		});

		/* serves all the static files */
		app.get(/^(.+)$/, function(req, res) {
			res.sendFile(__dirname + req.params[0]);
		});

	}

	function listener() {

		io.on('connection', function(socket) {
			clients++;
			console.log("Playing (%d): %s", clients, socket["conn"]["id"]);
			// io.emit("players", {"num": clients});


			GS.createPlayer(socket["conn"]["id"]);
			if (clients == 1) {
				GameState.leader = socket["conn"]["id"];
				io.emit("bc_refresh", GameState);
			}

			socket.on("update", function(state) {
				GS.updatePlayerCoords(state.id, state.status);
				io.emit("bc_refresh", GameState);
			});

			socket.on("bullet", function(bullet) {
				io.emit("bc_bullet", bullet);
			});

			socket.on("enemies", function(enem) {
				io.emit("bc_enemies", enem);
			});

			socket.on("score_update", function(score) {
				GameState.score += score;
				io.emit("bc_refresh", GameState);
			});

			socket.on("PingMeasurement", function() {
				socket.emit("PingReply");
			})

			socket.on("disconnect", function() {
				clients--;
				GS.destroyPlayer(socket["conn"]["id"]);
				io.emit("disconnection", socket["conn"]["id"]);
				if (clients == 0)
					GS.destroyGameState();
				// io.emit("players", {"num": clients });
				console.log("Playing (%d)", clients);
			});
		});


	}


	GS.loadConfigFile(function() {
		init_static();
		listener();
	});

})();