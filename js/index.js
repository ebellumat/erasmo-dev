const video = document.getElementById("myvideo");
const handimg = document.getElementById("handimage");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
let trackButton = document.getElementById("trackbutton");
let nextImageButton = document.getElementById("nextimagebutton");
let updateNote = document.getElementById("updatenote");

let imgindex = 1;
let isVideo = false;
let model = null;

let positionX = 0;
let positionY = 0;

// video.width = 500
// video.height = 400

const modelParams = {
  flipHorizontal: true, // flip e.g for video
  maxNumBoxes: 3, // maximum number of boxes to detect
  iouThreshold: 0.5, // ioU threshold for non-max suppression
  scoreThreshold: 0.6 // confidence threshold for predictions.
};

function startVideo() {
  handTrack.startVideo(video).then(function(status) {
    console.log("video started", status);
    if (status) {
      updateNote.innerText = "Video started. Now tracking";
      isVideo = true;

      runDetection();

      // var image = document.getElementById("canvas");

      // if (image) {
      //   const aspectRatio = 4 / 3; // Set the desired aspect ratio
      //   const windowWidth = window.innerWidth;
      //   const windowHeight = window.innerHeight;
      //   let width, height;

      //   if (windowWidth / windowHeight > aspectRatio) {
      //     height = windowHeight;
      //     width = height * aspectRatio;
      //   } else {
      //     width = windowWidth;
      //     height = width / aspectRatio;
      //   }

      //   image.style.width = width + "px";
      //   image.style.height = height + "px";
      // }
    } else {
      updateNote.innerText = "Please enable video";
    }
  });
}

function toggleVideo() {
  if (!isVideo) {
    updateNote.innerText = "Starting video";
    startVideo();
  } else {
    updateNote.innerText = "Stopping video";
    handTrack.stopVideo(video);
    isVideo = false;
    updateNote.innerText = "Video stopped";
  }
}

nextImageButton.addEventListener("click", function() {
  nextImage();
});

trackButton.addEventListener("click", function() {
  toggleVideo();
});

function nextImage() {
  imgindex++;
  handimg.src = "images/" + (imgindex % 9) + ".jpg";
  // alert(handimg.src)
  setTimeout(() => {
    runDetectionImage(handimg);
  }, 500);
}

function runDetection() {
  model.detect(video).then(predictions => {
    // console.log("Predictions: ", predictions);
    model.renderPredictions(predictions, canvas, context, video);
    if (isVideo) {
      requestAnimationFrame(runDetection);

      const handPrediction = predictions.find(
        prediction => prediction.label === "open"
      );

      if (handPrediction) {
        const bbox = handPrediction.bbox;
        const handX = bbox[0] + bbox[2] / 2;
        const handY = bbox[1] + bbox[3] / 2;

        // Calculate the touch position relative to the window
        const windowX = (handX / 640) * window.innerWidth;
        const windowY = (handY / 480) * window.innerHeight;

        positionX = windowX;
        positionY = windowY;

        var image = document.getElementById("canvas");

        image.style.position = "absolute";

        image.style.left = 0 + "px";
        image.style.top = 0 + "px";
      }
    }
  });
}

function runDetectionImage(img) {
  model.detect(img).then(predictions => {
    // console.log("Predictions: ", predictions);
    model.renderPredictions(predictions, canvas, context, img);
  });
}

// Load the model.
handTrack.load(modelParams).then(lmodel => {
  // detect objects in the image.
  model = lmodel;
  console.log(model);
  updateNote.innerText = "Loaded Model!";
  runDetectionImage(handimg);
  trackButton.disabled = false;
  nextImageButton.disabled = false;
  toggleVideo();
});

// GAME

var w = window.innerWidth,
  h = window.innerHeight;

var game = new Phaser.Game(w, h, Phaser.CANVAS, "game", {
  preload: preload,
  create: create,
  update: update,
  render: render
});

function preload() {
  this.load.image(
    "toast",
    "http://www.pngmart.com/files/5/Toast-PNG-Free-Download.png"
  );
  this.load.image(
    "burnt",
    "http://pluspng.com/img-png/burnt-food-png-the-first-incident-involved-toast-or-to-be-more-precise-burnt-toast-246.png"
  );
  this.load.image(
    "toaster",
    "https://purepng.com/public/uploads/large/purepng.com-toastertoastertoast-makerelectric-smalltoast-sliced-breadheat-17015284328352zoyd.png"
  );

  var bmd = game.add.bitmapData(100, 100);
  bmd.ctx.fillStyle = "#00ff00";
  bmd.ctx.arc(50, 50, 50, 0, Math.PI * 2);
  bmd.ctx.fill();
  game.cache.addBitmapData("good", bmd);

  var bmd = game.add.bitmapData(64, 64);
  bmd.ctx.fillStyle = "#ff0000";
  bmd.ctx.arc(32, 32, 32, 0, Math.PI * 2);
  bmd.ctx.fill();
  game.cache.addBitmapData("bad", bmd);
}

var good_objects,
  bad_objects,
  slashes,
  line,
  scoreLabel,
  score = 0,
  points = [];

var fireRate = 1000;
var nextFire = 0;

function create() {
  game.stage.backgroundColor = "#aaaaaa";
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.arcade.gravity.y = 300;

  good_objects = createGroup(4, game.cache.getBitmapData("good"));
  bad_objects = createGroup(4, game.cache.getBitmapData("bad"));

  slashes = game.add.graphics(0, 0);

  scoreLabel = game.add.text(10, 10, "Tip: get the green ones!");
  scoreLabel.fill = "white";

  emitter = game.add.emitter(0, 0, 300);
  emitter.makeParticles("parts");
  emitter.gravity = 300;
  emitter.setYSpeed(-400, 400);

  throwObject();
}

function createGroup(numItems, sprite) {
  var group = game.add.group();
  group.enableBody = true;
  group.physicsBodyType = Phaser.Physics.ARCADE;
  group.createMultiple(numItems, sprite);
  group.setAll("checkWorldBounds", true);
  group.setAll("outOfBoundsKill", true);
  return group;
}

function throwObject() {
  if (
    game.time.now > nextFire &&
    good_objects.countDead() > 0 &&
    bad_objects.countDead() > 0
  ) {
    nextFire = game.time.now + fireRate;
    throwGoodObject();
    if (Math.random() > 0.5) {
      throwBadObject();
    }
  }
}

function throwGoodObject() {
  var obj = good_objects.getFirstDead();
  obj.reset(
    game.world.centerX + Math.random() * 100 - Math.random() * 100,
    600
  );
  obj.anchor.setTo(0.5, 0.5);
  //obj.body.angularAcceleration = 100;
  game.physics.arcade.moveToXY(
    obj,
    game.world.centerX,
    game.world.centerY,
    530
  );
}

function throwBadObject() {
  var obj = bad_objects.getFirstDead();
  obj.reset(
    game.world.centerX + Math.random() * 100 - Math.random() * 100,
    600
  );
  obj.anchor.setTo(0.5, 0.5);
  //obj.body.angularAcceleration = 100;
  game.physics.arcade.moveToXY(
    obj,
    game.world.centerX,
    game.world.centerY,
    530
  );
}

function update() {
  throwObject();

  points.push({
    x: positionX,
    y: positionY
  });
  points = points.splice(points.length - 15, points.length);
  //game.add.sprite(game.input.x, game.input.y, 'hit');

  if (points.length < 1 || points[0].x == 0) {
    return;
  }

  slashes.clear();
  slashes.beginFill(0x000099);
  slashes.alpha = 0.5;
  slashes.moveTo(points[0].x, points[0].y);
  for (var i = 1; i < points.length; i++) {
    slashes.lineTo(points[i].x, points[i].y);
  }
  slashes.endFill();

  for (var i = 1; i < points.length; i++) {
    line = new Phaser.Line(
      points[i].x,
      points[i].y,
      points[i - 1].x,
      points[i - 1].y
    );
    game.debug.geom(line);

    good_objects.forEachExists(checkIntersects);
    bad_objects.forEachExists(checkIntersects);
  }
}

var contactPoint = new Phaser.Point(0, 0);

function checkIntersects(fruit, callback) {
  var l1 = new Phaser.Line(
    fruit.body.right - fruit.width,
    fruit.body.bottom - fruit.height,
    fruit.body.right,
    fruit.body.bottom
  );
  var l2 = new Phaser.Line(
    fruit.body.right - fruit.width,
    fruit.body.bottom,
    fruit.body.right,
    fruit.body.bottom - fruit.height
  );
  l2.angle = 90;

  if (
    Phaser.Line.intersects(line, l1, true) ||
    Phaser.Line.intersects(line, l2, true)
  ) {
    console.log(positionX, positionY);

    contactPoint.x = positionX;
    contactPoint.y = positionY;
    var distance = Phaser.Point.distance(
      contactPoint,
      new Phaser.Point(fruit.x, fruit.y)
    );
    if (
      Phaser.Point.distance(contactPoint, new Phaser.Point(fruit.x, fruit.y)) >
      110
    ) {
      return;
    }

    if (fruit.parent == good_objects) {
      killFruit(fruit);
    } else {
      resetScore();
    }
  }
}

function resetScore() {
  var highscore = Math.max(score, localStorage.getItem("highscore"));
  localStorage.setItem("highscore", highscore);

  good_objects.forEachExists(killFruit);
  bad_objects.forEachExists(killFruit);

  score = 0;
  scoreLabel.text = "Game Over!\nHigh Score: " + highscore;
  // Retrieve
}

function render() {}

function killFruit(fruit) {
  emitter.x = fruit.x;
  emitter.y = fruit.y;
  emitter.start(true, 2000, null, 4);
  fruit.kill();
  points = [];
  score++;
  scoreLabel.text = "Score: " + score;
}
