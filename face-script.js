
const video = document.getElementById("video");
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(startWebCam);

function startWebCam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error("Error accessing webcam:", error);
    });
}

// Add event listener for when the video starts playing
video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  // Set canvas position and size
  canvas.style.position = 'absolute';
  canvas.style.top = video.offsetTop + 'px'; // Align with video
  canvas.style.left = video.offsetLeft + 'px'; // Align with video
  canvas.style.zIndex = '1'; // Ensure the canvas is above the video

  // Match canvas dimensions to video dimensions
  faceapi.matchDimensions(canvas, { height: video.height, width: video.width });

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    // Clear previous canvas drawings
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    // Resize the results to fit the canvas
    const resizedDetections = faceapi.resizeResults(detections, {
      height: video.height,
      width: video.width,
    });

    // Draw the detections and other information
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    // Draw age and gender information
    resizedDetections.forEach((detection) => {
      const { x, y, width, height } = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(
        { x, y, width, height },
        { label: Math.round(detection.age) + " year old " + detection.gender }
      );
      drawBox.draw(canvas);
    });
    if (resizedDetections.length > 0) {
        const detection = resizedDetections[0];
        document.getElementById("ageValue").innerText = Math.round(detection.age) + " years";
        document.getElementById("genderValue").innerText = detection.gender;

        const emotions = detection.expressions;
        const emotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
        document.getElementById("emotionValue").innerText = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    } else {
        document.getElementById("ageValue").innerText = "-";
        document.getElementById("genderValue").innerText = "-";
        document.getElementById("emotionValue").innerText = "-";
    }
    console.log(detections); // Log all detections
  }, 100);
});


