var cv = require('opencv');
var sleep = require('sleep');

var camera = new cv.VideoCapture(0); //open camera

//set the video size to 512x288
camera.setWidth(640);
camera.setHeight(480);
var window = new cv.NamedWindow('Camera');
var firstFrame, frameDelta, gray, thresh;

sleep.sleep(1);
camera.read(function(err,frame) {
	if(!frame || !frame.size()[0] || !frame.size()[1]) return;
	firstFrame = frame;
	//convert to grayscale
	// firstFrame.convertGrayscale();
	firstFrame.cvtColor('CV_BGR2GRAY');
	firstFrame.gaussianBlur([21, 21]);
});

var lowThresh = 0;
var highThresh = 100;
var nIters = 2;
var maxArea = 2500;

var GREEN = [0, 255, 0]; // B, G, R
var WHITE = [255, 255, 255]; // B, G, R
var RED   = [0, 0, 255]; // B, G, R

var count = 0;
interval = setInterval(function() {
	camera.read(function(err, frame) {
		if(err) {
			console.log('camera.read error: %j', err);
			return;
		}
		if(!frame || !frame.size()[0] || !frame.size()[1]) return;
		gray = frame.copy();
		gray.cvtColor('CV_BGR2GRAY');
		gray.gaussianBlur([21, 21]);

		frameDelta = new cv.Matrix();
		//compute difference between first frame and current frame
		frameDelta.absDiff(firstFrame, gray);
		thresh = frameDelta.threshold(25,255);
		thresh.dilate(2);

		count++;
		if(count%10===0) firstFrame = gray;

		var contours = thresh.findContours();

		const lineType = 8;
		const maxLevel = 0;
		const thickness = 1;

		for(i = 0; i < contours.size(); i++) {
			if(contours.area(i) > maxArea) {
				var moments = contours.moments(i);
				var cgx = Math.round(moments.m10 / moments.m00);
				var cgy = Math.round(moments.m01 / moments.m00);
				frame.drawContour(contours, i, GREEN, thickness, lineType, maxLevel, [0, 0]);
				frame.line([cgx - 5, cgy], [cgx + 5, cgy], RED);
				frame.line([cgx, cgy - 5], [cgx, cgy + 5], RED);
			}
		}


		// for(i = 0; i < contours.size(); i++) {

		// 	if(contours.area(i) < 500) {
		// 		continue;
		// 	}

		// 	frame.putText("Motion Detected", 10, 20, cv.FONT_HERSHEY_SIMPLEX, [0, 0, 255], 0.75, 2);
		// }

		window.show(frame);
		keyPressed = window.blockingWaitKey(0, 50);
		
		if(keyPressed == 27) {
			//exit if ESC is pressed
			clearInterval(interval);
		}


	});
}, 100);