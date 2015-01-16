var fs = require("fs");
var CONFIG = null;

module.exports = {

    loadConfigFile: function(callback) {
        fs.readFile("./server/config.json", 'utf8', function(err, data) {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            CONFIG = JSON.parse(data);
            callback();
        });
    },
    // fs.readFile("./server/names.json", 'utf8', function(err, data) {
    //     if (err) {
    //         console.log('Error: ' + err);
    //         return;
    //     }
    //     NAMES = JSON.parse(data);
    // });
    createPlayer: function(socket_id) {
        GameState.Users[socket_id] = {
            x: CONFIG.Player.start_pos[0],
            y: CONFIG.Player.start_pos[1],
        };
    },
    destroyPlayer: function(socket_id) {
        delete GameState.Users[socket_id];
        if (GameState.leader == socket_id && clients > 0)
            GameState.leader = leader_election();
        io.emit("disconnection", socket_id);
    },
    updatePlayerCoords: function(socket_id, user) {
        if (typeof GameState.Users[socket_id] != 'undefined') {
            GameState.Users[socket_id].x = user.x;
            GameState.Users[socket_id].y = user.y;
        }
    },
    // createGameState: function(level) {
    //     GameState.uid = 1;
    //     GameState.leader = leader_election();
    //     GameState.level = level;
    //     GameState.aliveEnemies = computeAliveEnemies(level);
    //     GameState.config = CONFIG;
    //     GameState.crown_position = {
    //         x: CONFIG.Items.crown.start_pos[0],
    //         y: CONFIG.Items.crown.start_pos[1]
    //     };
    //     GameState.config.Player.leader_speed = GameState.config.Player.regular_speed;

    //     GameState.Enemies = {};
    //     for (var i = 0; i < GameState.aliveEnemies; i++) {
    //         var types = ['common_enemy', 'flux_enemy'];
    //         var acceleration = 0.5
    //         var attack_radius = 5;
    //         if (i < Math.ceil(GameState.aliveEnemies * 0.25)) //Creating fluxes
    //         {
    //             speed = 0;
    //             type = types[1];
    //             acceleration = CONFIG.Enemy.flux_enemy.acceleration;
    //             attack_radius = CONFIG.Enemy.flux_enemy.attack_radius;
    //         } else {
    //             attack_radius = CONFIG.Enemy.common_enemy.attack_radius;
    //             speed = common.randomInt(CONFIG.Enemy.common_enemy.min_speed, CONFIG.Enemy.common_enemy.max_speed);
    //             type = types[0];
    //         }
    //         var direction = common.randomInt(0, 4);
    //         if (direction == 0) {
    //             range = {
    //                 x: common.randomInt(CONFIG.Game.spawn_pos["0x"][0], CONFIG.Game.spawn_pos["0x"][1]),
    //                 y: common.randomInt(CONFIG.Game.spawn_pos["0y"][0], CONFIG.Game.spawn_pos["0y"][1])
    //             }
    //         } else if (direction == 1) {
    //             range = {
    //                 x: common.randomInt(CONFIG.Game.spawn_pos["1x"][0], CONFIG.Game.spawn_pos["1x"][1]),
    //                 y: common.randomInt(CONFIG.Game.spawn_pos["1y"][0], CONFIG.Game.spawn_pos["1y"][1])
    //             }
    //         } else if (direction == 2) {
    //             range = {
    //                 x: common.randomInt(CONFIG.Game.spawn_pos["2x"][0], CONFIG.Game.spawn_pos["2x"][1]),
    //                 y: common.randomInt(CONFIG.Game.spawn_pos["2y"][0], CONFIG.Game.spawn_pos["2y"][1])
    //             }
    //         } else {
    //             range = {
    //                 x: common.randomInt(CONFIG.Game.spawn_pos["3x"][0], CONFIG.Game.spawn_pos["3x"][1]),
    //                 y: common.randomInt(CONFIG.Game.spawn_pos["3y"][0], CONFIG.Game.spawn_pos["3y"][1])
    //             }
    //         }
    //         GameState.Enemies[i] = new ServerEnemy(range.x, range.y, 100, [speed, speed],
    //             type, "idle",
    //             acceleration,
    //             attack_radius);
    //     }
    //     socket_list[GameState.leader].emit("StageMessage", {
    //         x: 0.5,
    //         y: 0.5,
    //         message: "You are the leader!",
    //         timeout: 3000
    //     });
    //     serverinterval = setInterval(serverloop, 1000 / CONFIG.Game.max_fps);
    // },
    destroyGameState: function() {
        //clearInterval(serverinterval);
        GameState = {};
        GameState.Users = {};
        GameState.config = CONFIG;
        GameState.Enemies = {};
        GameState.score = 0;
    }
}

function leader_election() {
    var user_list = []
    for (var k in GameState.Users)
        user_list.push(k);
    return user_list[randomInt(0, user_list.length - 1)];
}

function randomInt(min, max) {
    return Math.round(min + Math.random() * (max - min));
}

function randomFloat(min, max) {
    return min + Math.random() * (max - min);
}

function euclidean_distance(object1, object2) {
    return Math.sqrt((object1.x - object2.x) * (object1.x - object2.x) + (object1.y - object2.y) * (object1.y - object2.y));
}