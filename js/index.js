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
    console.log("Predictions: ", predictions);
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
        const windowX = (handX / videoWidth) * window.innerWidth;
        const windowY = (handY / videoHeight) * window.innerHeight;

        // Simulate touch events
        const touchEvent = new TouchEvent("touchmove", {
          touches: [
            new Touch({
              identifier: Date.now(),
              target: document.documentElement,
              clientX: windowX,
              clientY: windowY
            })
          ],
          targetTouches: [],
          changedTouches: [
            new Touch({
              identifier: Date.now(),
              target: document.documentElement,
              clientX: windowX,
              clientY: windowY
            })
          ],
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window
        });

        // Dispatch the touch event to simulate mouse movement
        document.documentElement.dispatchEvent(touchEvent);
      }
    }
  });
}

function runDetectionImage(img) {
  model.detect(img).then(predictions => {
    console.log("Predictions: ", predictions);
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
});
