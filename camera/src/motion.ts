import * as cv						from 'opencv4nodejs';

const bgSubtractor = new cv.BackgroundSubtractorMOG2(500, 92, true);

const dilateKernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4));
const dilatePoint = new cv.Point2(-1, -1);

export function detectMotion(image:cv.Mat):number {
	const foreGroundMask = bgSubtractor.apply(image);

	const iterations = 2;
	// const blurred = foreGroundMask.blur(new cv.Size(4, 4));
	const dilated = foreGroundMask.dilate(dilateKernel, dilatePoint,iterations);
	// const blurred = dilated.blur(new cv.Size(10, 10));
	const thresholded = dilated.threshold(128, 255, cv.THRESH_BINARY);

	const minPxSize = 2000;
	drawRectAroundBlobs(thresholded, image, minPxSize);

	var motion = thresholded.countNonZero() / (image.sizes[0]*image.sizes[1]);
	return motion;
}

const red = new cv.Vec3(0,0,255);

function drawRectAroundBlobs(binaryImg:cv.Mat, dstImg:cv.Mat, minPxSize:number) {
	const {centroids,stats} = binaryImg.connectedComponentsWithStats();

	var rects = [];		// {start,end,size}

	// pretend label 0 is background
	for(let label=1; label<centroids.rows; label+=1) {
		const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
		const [x2, y2] = [
			x1 + stats.at(label, cv.CC_STAT_WIDTH),
			y1 + stats.at(label, cv.CC_STAT_HEIGHT)
		];
		const size = stats.at(label, cv.CC_STAT_AREA);
		rects.push({start:new cv.Point2(x1,y1), end:new cv.Point2(x2,y2), size});
	}

	rects = rects.sort((a,b) => b.size-a.size);
	rects = rects.slice(0,1);
	rects.forEach(rect => {
		dstImg.drawRectangle(rect.start, rect.end, red, 2);
	});
}