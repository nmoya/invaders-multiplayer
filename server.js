var port = process.env.PORT || 3000;
var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
clients = 0;

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
		res.sendfile(__dirname + req.params[0]);
	});
}

function listener() {

	io.on('connection', function(socket) {
		clients++;
		console.log("Playing (%d)", clients);
		io.emit("players", {
			"num": clients
		});

		socket.on("disconnect", function() {
			clients--;
			io.emit("players", {
				"num": clients
			});
		})
	});


}



init_static();
listener();