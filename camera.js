'use strict';

const cv = require('opencv');

class Camera {
	constructor(options={}) {
		console.log('Camera()')
		this.width = options.width || 640;
		this.height = options.height || 480;
		this.delay = options.delay || 50;
		this.state = false;

		this.camera = new cv.VideoCapture(0);
		this.camera.setWidth(this.width);
		this.camera.setHeight(this.height);
		console.log('\t options=%j', options);
	}
	getFrame(done) {
		this.camera.read(done);
	}

	onFrame(func) {
// 		console.log('Camera.onFrame()');
		this.frameFunc = func;
	}
	sendFrame() {
		if(!this.frameFunc || !this.state) return;
		var self = this;
		this.getFrame(function(err,image) {
// 			console.log('sending frame');
			self.frameFunc(err,image, function() {
				setTimeout(self.sendFrame.bind(self), self.delay);
			});
		});
	}
	start() {
		this.state = true;
		this.sendFrame();
	}
	stop() {
		this.state = false;
	}
};

module.exports = Camera;
