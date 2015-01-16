function InvadersGame() {

    var player;
    var aliens;
    var bullets;
    var bulletTime = 0;
    var cursors;
    var fireButton;
    var explosions;
    var starfield;
    var first_time = true;
    var add_tween = true;
    var score = 0;
    var scoreString = '';
    var scoreText = null;
    var lives;
    var enemyBullet;
    var firingTimer = 0;
    var stateText;
    var livingEnemies = [];

    this.preload = function() {
        game.load.image('bullet', 'assets/sprites/bullet.png');
        game.load.image('enemyBullet', 'assets/sprites/enemy-bullet.png');
        game.load.spritesheet('invader', 'assets/sprites/invader32x32x4.png', 32, 32);
        game.load.image('ship', 'assets/sprites/player.png');
        game.load.image('ally', 'assets/sprites/ally-player.png');
        game.load.spritesheet('kaboom', 'assets/sprites/explode.png', 128, 128);
        game.load.image('starfield', 'assets/sprites/starfield.png');
        game.load.image('background', 'assets/sprites/background2.png');
        if (typeof socket.io.engine.id == "undefined")
            alert("undefined socket id inside invaders");

    }
    this.create = function() {

        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.stage.disableVisibilityChange = true;

        //  The scrolling starfield background
        starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

        //  Our bullet group
        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(100, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 1);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        // The enemy's bullets
        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;
        enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
        enemyBullets.createMultiple(30, 'enemyBullet');
        enemyBullets.setAll('anchor.x', 0.5);
        enemyBullets.setAll('anchor.y', 1);
        enemyBullets.setAll('outOfBoundsKill', true);
        enemyBullets.setAll('checkWorldBounds', true);

        //  The hero!
        Players[my_id] = game.add.sprite(400, 500, 'ship');
        Players[my_id].anchor.setTo(0.5, 0.5);
        game.physics.enable(Players[my_id], Phaser.Physics.ARCADE);

        //  The baddies!
        aliens = game.add.group();
        aliens.enableBody = true;
        aliens.physicsBodyType = Phaser.Physics.ARCADE;

        //  The score
        scoreString = 'Score: ';
        scoreText = game.add.text(10, 10, scoreString + score, {
            font: '18px press_start_kregular',
            fill: '#fff'
        });
        scoreText.visible = false;
        scoreText.visible = true;
        scoreText.text = scoreString + score;

        //  Lives
        lives = game.add.group();
        game.add.text(game.world.width - 100, 10, 'Lives', {
            font: '18px press_start_kregular',
            fill: '#fff'
        });

        //  Text
        stateText = game.add.text(game.world.centerX, game.world.centerY, ' ', {
            font: '28px press_start_kregular',
            fill: '#fff'
        });
        stateText.anchor.setTo(0.5, 0.5);
        stateText.visible = false;

        for (var i = 0; i < 3; i++) {
            var ship = lives.create(game.world.width - 90 + (30 * i), 60, 'ship');
            ship.anchor.setTo(0.5, 0.5);
            ship.angle = 90;
            ship.alpha = 0.7;
        }

        //  An explosion pool
        explosions = game.add.group();
        explosions.createMultiple(30, 'kaboom');
        explosions.forEach(invaders.setupInvader, this);

        //  And some controls to play the game with
        cursors = game.input.keyboard.createCursorKeys();
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        if (invaders.isLeader())
            invaders.createAliens();
    }
    this.update = function() {

        //  Scroll the background
        var key_press = false;
        starfield.tilePosition.y += 2;

        if (Players[my_id].alive) {
            //  Reset the Players[my_id], then check for movement keys
            Players[my_id].body.velocity.setTo(0, 0);

            if (cursors.left.isDown) {
                Players[my_id].body.velocity.x = -200;
                key_press = true;
            } else if (cursors.right.isDown) {
                Players[my_id].body.velocity.x = 200;
                key_press = true;
            }

            //  Firing?
            if (fireButton.isDown) {
                invaders.fireBullet();
            }

            if (game.time.now > firingTimer) {
                invaders.enemyFires();
            }
            if (key_press) {
                socket.emit("update", {
                    "id": my_id,
                    "status": {
                        "x": Players[my_id].body.x,
                        "y": Players[my_id].body.y
                    }
                });
            }

            //  Run collision
            game.physics.arcade.overlap(bullets, aliens, invaders.collisionHandler, null, this);
            game.physics.arcade.overlap(enemyBullets, Players[my_id], invaders.enemyHitsPlayer, null, this);
        }
        invaders.updateOtherPlayers();
        if (invaders.isLeader()) {
            enemies = [];
            i = 0;
            aliens.forEach(function(a) {
                enemies.push({
                    "id": i,
                    "status": {
                        "alive": a.alive,
                        "x": aliens.x,
                        "y": aliens.y
                    }
                });
                i += 1;
            });
            socket.emit("enemies", enemies);
            if (add_tween) {
                var tween = game.add.tween(aliens).to({
                    x: 350
                }, 2500, Phaser.Easing.Linear.None, true, 0, 1000, true);

                //  When the tween loops it calls descend
                tween.onLoop.add(invaders.descend, this);
                add_tween = false;
            }
        } else {
            if (first_time) {
                invaders.createAliensNotLeader();
                first_time = false;
            } else {
                invaders.updateAliensNotLeader();
            }
        }
    }

    this.createAliens = function() {

        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 10; x++) {
                var alien = aliens.create(x * 48, y * 50, 'invader');
                alien.anchor.setTo(0.5, 0.5);
                alien.animations.add('fly', [0, 1, 2, 3], 20, true);
                alien.play('fly');
                alien.body.moves = false;
            }
        }

        aliens.x = 50;
        aliens.y = 50;

        //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
        // var tween = game.add.tween(aliens).to({
        //     x: 350
        // }, 2500, Phaser.Easing.Linear.None, true, 0, 1000, true);

        // //  When the tween loops it calls descend
        // tween.onLoop.add(invaders.descend, this);
    }
    this.createAliensNotLeader = function() {
        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 10; x++) {
                var alien = aliens.create(x * 48, y * 50, 'invader');
                alien.anchor.setTo(0.5, 0.5);
                alien.animations.add('fly', [0, 1, 2, 3], 20, true);
                alien.play('fly');
                alien.body.moves = false;
            }
        }

        aliens.x = 50;
        aliens.y = 50;
        //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
        // var tween = game.add.tween(aliens).to({
        //     x: 350
        // }, 2500, Phaser.Easing.Linear.None, true, 0, 1000, true);

        // //  When the tween loops it calls descend
        // tween.onLoop.add(invaders.descend, this);
    }
    this.updateAliensNotLeader = function() {
        var i = 0;
        aliens.forEach(function(a) {
            if (!Aliens[i].status.alive)
                a.kill();
            i += 1;
        });
        for (var i in Aliens) {
            aliens.x = Aliens[i].status.x;
            aliens.y = Aliens[i].status.y;
            break;
        }

    }

    this.setupInvader = function(invader) {
        invader.anchor.x = 0.5;
        invader.anchor.y = 0.5;
        invader.animations.add('kaboom');
    }

    this.descend = function() {
        aliens.y += 10;
    }
    this.scoreUpdate = function(score) {
        if (scoreText != null)
            scoreText.text = scoreString + score;
    }
    this.collisionHandler = function(bullet, alien) {
        //  When a bullet hits an alien we kill them both
        bullet.kill();


        if (invaders.isLeader()) {
            socket.emit("score_update", 20);
            alien.kill();
        }

        //  And create an explosion :)
        var explosion = explosions.getFirstExists(false);
        explosion.reset(alien.body.x, alien.body.y);
        explosion.play('kaboom', 30, false, true);

        if (aliens.countLiving() == 0) {
            if (invaders.isLeader())
                socket.emit("score_update", 1000);

            enemyBullets.callAll('kill', this);
            stateText.text = " You Won! \n Click to restart";
            stateText.visible = true;

            //the "click to restart" handler
            game.input.onTap.addOnce(invaders.restart, this);
        }

    }

    this.enemyHitsPlayer = function(player, bullet) {

        bullet.kill();

        live = lives.getFirstAlive();

        if (live) {
            //live.kill();
        }

        //  And create an explosion :)
        var explosion = explosions.getFirstExists(false);
        explosion.reset(player.body.x, player.body.y);
        explosion.play('kaboom', 30, false, true);

        // When the player dies
        if (lives.countLiving() < 1) {
            player.kill();
            enemyBullets.callAll('kill');

            stateText.text = " GAME OVER \n Click to restart";
            stateText.visible = true;

            //the "click to restart" handler
            game.input.onTap.addOnce(invaders.restart, this);
        }

    }

    this.enemyFires = function() {

        //  Grab the first bullet we can from the pool
        enemyBullet = enemyBullets.getFirstExists(false);

        livingEnemies.length = 0;

        aliens.forEachAlive(function(alien) {

            // put every living enemy in an array
            livingEnemies.push(alien);
        });


        if (enemyBullet && livingEnemies.length > 0) {

            var random = game.rnd.integerInRange(0, livingEnemies.length - 1);

            // randomly select one of them
            var shooter = livingEnemies[random];
            // And fire the bullet from this enemy
            enemyBullet.reset(shooter.body.x, shooter.body.y);

            game.physics.arcade.moveToObject(enemyBullet, Players[my_id], 120);
            firingTimer = game.time.now + 2000;
        }

    }

    this.fireBullet = function() {

        //  To avoid them being allowed to fire too fast we set a time limit
        if (game.time.now > bulletTime) {
            //  Grab the first bullet we can from the pool
            bullet = bullets.getFirstExists(false);

            if (bullet) {
                //  And fire it
                bullet.reset(Players[my_id].x, Players[my_id].y + 8);
                bullet.body.velocity.y = -400;
                bulletTime = game.time.now + 200;

                socket.emit("bullet", {
                    "id": my_id,
                    "status": {
                        "x": Players[my_id].x,
                        "y": Players[my_id].y
                    }
                });
            }
        }

    }

    this.insertBulletFromOtherPlayer = function(bu) {
        b = bullets.getFirstExists(false);
        if (b) {
            //  And fire it
            b.reset(bu.status.x, bu.status.y + 8);
            b.body.velocity.y = -400;
        }
    }

    this.restart = function() {

        //  A new level starts

        //resets the life count
        lives.callAll('revive');
        //  And brings the aliens back from the dead :)
        aliens.removeAll();
        if (invaders.isLeader())
            invaders.createAliens();

        //revives the player
        Players[my_id].revive();
        //hides the text
        stateText.visible = false;

    }

    this.updateOtherPlayers = function() {
        for (key in GameState.Users) {
            if (key != my_id) {
                if (typeof Players[key] == "undefined") {
                    Players[key] = game.add.sprite(GameState.Users[key].x, GameState.Users[key].y, 'ally');
                    Players[key].anchor.setTo(0.5, 0.5);
                    game.physics.enable(Players[key], Phaser.Physics.ARCADE);
                }
                Players[key].body.x = GameState.Users[key].x;
                Players[key].body.y = GameState.Users[key].y;
            }
        }
    }

    this.killPlayer = function(id) {
        if (typeof Players[id] != "undefined") {
            console.log("Killing player %s", id);
            Players[id].kill();
            Players[id].destroy();
            console.log(Players[id].visible);
            delete GameState.Users[id];
            delete Players[id];
        }
    }
    this.isLeader = function() {
        return GameState.leader == my_id;
    }


    this.render = function() {

        // for (var i = 0; i < aliens.length; i++)
        // {
        //     game.debug.body(aliens.children[i]);
        // }

    }
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game-canvas', {
        preload: this.preload,
        create: this.create,
        update: this.update,
        render: this.render
    });
}