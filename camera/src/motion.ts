import * as cv						from 'opencv4nodejs';

const video = new cv.VideoCapture(0);
video.set(cv.CAP_PROP_FRAME_WIDTH, 1280);
video.set(cv.CAP_PROP_FRAME_HEIGHT, 768);

setInterval(() => {
	console.log('Get frame');
	var image = video.read();
	if(image) cv.imshow('Video', image);
	cv.waitKey(20);
}, 100);
