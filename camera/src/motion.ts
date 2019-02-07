import * as cv						from 'opencv4nodejs';

const video = new cv.VideoCapture(0);
video.set(cv.CAP_PROP_FRAME_WIDTH, 1280);
video.set(cv.CAP_PROP_FRAME_HEIGHT, 768);

const bgSubtractor = new cv.BackgroundSubtractorMOG2(500, 64, true);

const dilateKernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4));

while(1) {
	var image = video.read();
	if(!image) {cv.waitKey(100); continue;}

	const foreGroundMask = bgSubtractor.apply(image);

	// console.log('foreGroundMask: %j', foreGroundMask.countNonZero());


	// if(foreGroundMask.countNonZero()<10000) {cv.waitKey(100); continue;}

	const iterations = 1;
	// const blurred = foreGroundMask.blur(new cv.Size(4, 4));
	const dilated = foreGroundMask.dilate(
		dilateKernel,
		new cv.Point2(-1, -1),
		iterations
	);
	// const blurred = dilated.blur(new cv.Size(10, 10));
	const thresholded = dilated.threshold(128, 255, cv.THRESH_BINARY);
	console.log('thresholded: %j', thresholded.countNonZero());

	const minPxSize = 2000;
	drawRectAroundBlobs(thresholded, image, minPxSize);

	cv.imshow('image', image);
	cv.imshow('foreGroundMask', foreGroundMask);
	// cv.imshow('dilated', dilated);
	// cv.imshow('blurred', blurred);
	cv.imshow('thresholded', thresholded);
	cv.waitKey(100);
}

function drawRectAroundBlobs(binaryImg, dstImg, minPxSize, fixedRectWidth?) {
	const {centroids, stats} = binaryImg.connectedComponentsWithStats();

	// pretend label 0 is background
	for(let label=1; label<centroids.rows; label+=1) {
		const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
		const [x2, y2] = [
			x1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_WIDTH)),
			y1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_HEIGHT))
		];
		const size = stats.at(label, cv.CC_STAT_AREA);
		const red = new cv.Vec3(0,0,255);
		if(minPxSize<size) {
			dstImg.drawRectangle(new cv.Point2(x1,y1), new cv.Point2(x2,y2), {color:red, thickness:2});
		}
	}
}

/*
var lastImage = null;
var count = 0;
var guassSize = 5;
var lowThresh = 20;
var highThresh = 255;

while(1) {
	
	var image = video.read();
	if(!image) continue;

	var gray = image.bgrToGray();

	if(!lastImage) {
		lastImage = gray;
		continue;
	}
	gray = gray.gaussianBlur(new cv.Size(guassSize,guassSize), 5,5);
	
	var frameDelta:cv.Mat = lastImage.absdiff(gray);
	var thresh = frameDelta.threshold(lowThresh,highThresh, 0);
	thresh = thresh.dilate(
		cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
		new cv.Point(-1, -1),
		2
	);
	var motion = thresh.countNonZero();

	// var contours = thresh.findContours(1,1);

	// console.log('count=%j,\tmotion=%j,\tcontours', count++, motion, contours.length);
	// for(var i=0;i<contours.length;i++) {
	// 	image.drawContours(contours, new cv.Vec3(0,0,255), 0);
	// }

	cv.imshow('image',  image);
	// cv.imshow('delta',  frameDelta);
	cv.imshow('thresh', thresh);
	cv.waitKey(100);
	// lastImage = gray;
}
*/