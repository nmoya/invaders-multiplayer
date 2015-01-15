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
		config: {},
		Enemies: {},
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

		GS.loadConfigFile();
	}

	function listener() {

		io.on('connection', function(socket) {
			clients++;
			console.log("Playing (%d): %s", clients, socket["conn"]["id"]);
			// io.emit("players", {"num": clients});


			GS.createPlayer(socket["conn"]["id"]);

			socket.on("update", function(state) {
				GS.updatePlayerCoords(state.id, state.status);
				io.emit("refresh", GameState);


			});

			socket.on("disconnect", function() {
				clients--;
				GS.destroyPlayer(socket["conn"]["id"]);
				io.emit("disconnection", socket["conn"]["id"]);
				// io.emit("players", {"num": clients });
				console.log("Playing (%d)", clients);
			});
		});


	}



	init_static();
	listener();
})();