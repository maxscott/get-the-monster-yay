requirejs([
  'modules/loadimage'
], function(
  loadimage
) {
  var gameWidth = 512;
  var gameHeight = 480;

  // insert canvas element, get context
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  canvas.width = gameWidth;
  canvas.height = gameHeight;
  document.body.appendChild(canvas);

  // Game objects
  var hero = {
    imgUrl: 'images/hero.png',
    speed: 230,
    x: 0,
    y: 0
  };
  var monster = {
    imgUrl: 'images/monster.png',
    speed: 250,
    x: 0,
    y: 0
  };
  var background = {
    imgUrl: 'images/background.png'
  };
  var monstersCaught = 0;

  // Game assets
  var bgImage, heroImage, monsterImage;
  resources.load([hero.imgUrl, monster.imgUrl, background.imgUrl]);
  resources.onReady(function() {
    bgImage = resources.get('images/background.png');
    heroImage = resources.get('images/hero.png');
    monsterImage = resources.get('images/monster.png');
  });

  // input handling
  var keysDown = {};
  addEventListener("keydown", function (e) {
      keysDown[e.keyCode] = true;
  }, false);

  addEventListener("keyup", function (e) {
      keysDown[e.keyCode] = false;
  }, false);

  // reset game state
  var timeOfReset;
  var reset = function () {
    hero.x = canvas.width / 2;
    hero.y = canvas.height / 2;
    // Put monster somewhere randomly
    monster.x = 32 + (Math.random() * (canvas.width - 64));
    monster.y = 32 + (Math.random() * (canvas.height - 64));
    timeOfReset = new Date();
    dashLeft = 0;
    dashRight = 0;
    dashUp = 0;
    dashDown = 0;
  };

  var lastMove = {
    Right: true,
    Left: true,
    Down: true,
    Up: true
  };
  var dashLeft;
  var dashRight;
  var dashUp;
  var dashDown;
  var monsterMoves = function(modifier) {
    var greedy = {
      Right: false,
      Left: false,
      Down: false,
      Up: false
    };
    var herosGoing = {
      Right: false,
      Left: false,
      Down: false,
      Up: false
    };

    // greedily away from hero
    if (hero.y > monster.y) greedy.Up = true;
    if (hero.x > monster.x) greedy.Left = true;
    if (hero.x < monster.x) greedy.Right = true;
    if (hero.y < monster.y) greedy.Down = true; 

    // could go either way, pick one
    if (Math.abs(hero.x - monster.x) < 3) {
      greedy.Left = Math.random() < .5;
      greedy.Right = !greedy.Left;
    }
    if (Math.abs(hero.y - monster.y) < 3) {
      greedy.Up = Math.random() < .5;
      greedy.Down = !greedy.Up;
    }

    // you're against the wall, move away..
    // this is so inefficient, it Hurts
    if (dashLeft > 0) {
      greedy.Left = true;
      greedy.Right = false;
      dashLeft -= modifier;
    }
    if ((monster.x + 5 > gameWidth - 64) && (monster.x - hero.x > 150)) {
      dashLeft = (monster.x - hero.x) / monster.speed;
      dashRight = 0;
    }
    if (dashRight > 0) {
      greedy.Right = true;
      greedy.Left = false;
      dashRight -= modifier;
    }
    if ((monster.x - 5 < 64) && (hero.x - monster.x > 150)) {
      dashRight = (hero.x - monster.x) / monster.speed;
      dashLeft = 0;
    }
    if (dashUp > 0) {
      greedy.Up = true;
      greedy.Down = false;
      dashUp -= modifier;
    }
    if ((monster.y - 5 < 64) && (hero.y - monster.y > 150)) {
      dashUp = (hero.y - monster.y) / monster.speed;
      dashDown = 0;
    }
    // which way is the hero going
    if (herosLastMoves[0].y < hero.y) herosGoing.Up = true;
    if (herosLastMoves[0].x > hero.x) herosGoing.Left = true;
    if (herosLastMoves[0].x < hero.x) herosGoing.Right = true;
    if (herosLastMoves[0].y > hero.y) herosGoing.Down = true;

    for(move in greedy){
      // if(greedy[move]) {
      //   greedy[move] = greedy[move] && (Math.random() < .50);
      // } else {
      //   greedy[move] = lastMove[move] && (Math.random() < .90);
      // }
    }
    if (greedy.Up) monster.y -= monster.speed * modifier;
    if (greedy.Left) monster.x -= monster.speed * modifier;
    if (greedy.Right) monster.x += monster.speed * modifier;
    if (greedy.Down) monster.y += monster.speed * modifier;
    lastMove = greedy;
  }

  var herosLastMoves = [];
  var heroMoves = function(modifier) {
    var adjust = hero.speed * modifier;
    if (keysDown[38]) hero.y -= adjust;
    if (keysDown[40]) hero.y += adjust;
    if (keysDown[37]) hero.x -= adjust;
    if (keysDown[39]) hero.x += adjust;
    if(herosLastMoves.push({x: hero.x, y: hero.y}) > 10) {
      herosLastMoves.splice(0, 1);
    }
  }

  var characterHitsWalls = function(character) {
    character.x = Math.min(gameWidth - 64, character.x); 
    character.y = Math.min(gameHeight - 64, character.y);
    character.x = Math.max(32, character.x);
    character.y = Math.max(32, character.y);
  }

  // update game objects
  var update = function (deltaSeconds) {
    heroMoves(deltaSeconds);
    characterHitsWalls(hero);

    monsterMoves(deltaSeconds);
    characterHitsWalls(monster);

    // Hero meets monster
    if (hero.x <= (monster.x + 32) && monster.x <= (hero.x + 32) && 
        hero.y <= (monster.y + 32) && monster.y <= (hero.y + 32))
    {
      console.log('we caught one');
      ++monstersCaught;
      reset();
    }
  }

  var scoreAlpha = 1;
  var render = function(deltaAverage) {
    if (resources.isReady()) {
      ctx.drawImage(bgImage, 0, 0);
      ctx.drawImage(heroImage, hero.x, hero.y);
      ctx.drawImage(monsterImage, monster.x, monster.y);
    }

    // Score
    var resetDelta = new Date() - timeOfReset;
    scoreAlpha = (resetDelta < 1500) ? 1 : scoreAlpha - .03;
    ctx.fillStyle = "rgba(250, 250, 250, " + scoreAlpha + ")";
    ctx.font = "24px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("      Boom, I get you " + monstersCaught + " times", 32, 32);

    ctx.fillStyle = "rgba(250, 250, 250, 1)";
    ctx.font = "12px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("avg fps: " + Math.round(1/deltaAverage), 5, 5);
  }

  // compute the average of the deltas inline
  var lastDeltas = [];
  var sum = 0;
  var averageBuffer = 50;
  var deltaAverage = function(delta) {
    sum += delta;
    if(lastDeltas.length === averageBuffer){
      sum -= lastDeltas.splice(0, 1);
    }
    var count = lastDeltas.push(delta);
    return sum / count;
  }

  // silly main loop
  var main = function() {
    var now = Date.now();
    var delta = (now - then) / 1000;
    var average = deltaAverage(delta);
    then = now;

    update(delta);
    render(average);
    requestAnimationFrame(main);
  }

  var then = Date.now();
  reset();
  main();
});
