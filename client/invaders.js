function InvadersGame() {

    var player;
    var aliens;
    var bullets;
    var bulletTime = 0;
    var cursors;
    var fireButton;
    var explosions;
    var starfield;
    var score = 0;
    var scoreString = '';
    var scoreText;
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
        bullets.createMultiple(30, 'bullet');
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
        players[my_id] = game.add.sprite(400, 500, 'ship');
        players[my_id].anchor.setTo(0.5, 0.5);
        game.physics.enable(players[my_id], Phaser.Physics.ARCADE);

        //  The baddies!
        aliens = game.add.group();
        aliens.enableBody = true;
        aliens.physicsBodyType = Phaser.Physics.ARCADE;

        invaders.createAliens();

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
    }
    this.update = function() {

        //  Scroll the background
        var key_press = false;
        starfield.tilePosition.y += 2;

        if (players[my_id].alive) {
            //  Reset the players[my_id], then check for movement keys
            players[my_id].body.velocity.setTo(0, 0);

            if (cursors.left.isDown) {
                players[my_id].body.velocity.x = -200;
                key_press = true;
            } else if (cursors.right.isDown) {
                players[my_id].body.velocity.x = 200;
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
                        "x": players[my_id].body.x,
                        "y": players[my_id].body.y
                    }
                })
            }

            //  Run collision
            game.physics.arcade.overlap(bullets, aliens, invaders.collisionHandler, null, this);
            game.physics.arcade.overlap(enemyBullets, players[my_id], invaders.enemyHitsPlayer, null, this);
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
        var tween = game.add.tween(aliens).to({
            x: 350
        }, 2500, Phaser.Easing.Linear.None, true, 0, 1000, true);

        //  When the tween loops it calls descend
        tween.onLoop.add(invaders.descend, this);
    }

    this.setupInvader = function(invader) {
        invader.anchor.x = 0.5;
        invader.anchor.y = 0.5;
        invader.animations.add('kaboom');
    }

    this.descend = function() {
        aliens.y += 10;
    }


    this.updateOtherClients = function(GameState) {
        for (key in GameState.Users) {
            if (key != my_id) {
                if (typeof players[key] == "undefined") {
                    players[key] = game.add.sprite(400, 500, 'ally');
                    players[key].anchor.setTo(0.5, 0.5);
                    game.physics.enable(players[key], Phaser.Physics.ARCADE);
                }
                players[key].body.x = GameState.Users[key].x;
                players[key].body.y = GameState.Users[key].y;
            }
        }
    }


    this.collisionHandler = function(bullet, alien) {


        //  When a bullet hits an alien we kill them both
        bullet.kill();
        alien.kill();

        //console.log(aliens.getIndex(alien));

        //  Increase the score
        score += 20;
        scoreText.text = scoreString + score;

        //  And create an explosion :)
        var explosion = explosions.getFirstExists(false);
        explosion.reset(alien.body.x, alien.body.y);
        explosion.play('kaboom', 30, false, true);

        if (aliens.countLiving() == 0) {
            score += 1000;
            scoreText.text = scoreString + score;

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
            live.kill();
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

            game.physics.arcade.moveToObject(enemyBullet, players[my_id], 120);
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
                bullet.reset(players[my_id].x, players[my_id].y + 8);
                bullet.body.velocity.y = -400;
                bulletTime = game.time.now + 200;
            }
        }

    }

    this.resetBullet = function(bullet) {

        //  Called if the bullet goes out of the screen
        bullet.kill();

    }

    this.restart = function() {

        //  A new level starts

        //resets the life count
        lives.callAll('revive');
        //  And brings the aliens back from the dead :)
        aliens.removeAll();
        invaders.createAliens();

        //revives the player
        players[my_id].revive();
        //hides the text
        stateText.visible = false;

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