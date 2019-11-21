import * as moment		from 'moment';
import { sendEmail }	from '../lib/mailer';
import { config }		from '../config';

export function onCameraMotion(camera,frame) {
	console.log('onCameraMotion: %j: %j', camera.name, frame.stats.motion);
	sendCameraMotionEmail(camera,frame);
}

var lastEmailDate = null;

function sendCameraMotionEmail(camera, frame) {
	if(lastEmailDate && moment().diff(lastEmailDate,'s')<30) return false;

	if(!config.mailer || !config.mailer.to) return false;

	console.log('sendCameraMotionEmail: %j: %j', camera.name, frame.stats.motion);
	lastEmailDate = new Date();

	var image = new Buffer(frame.image).toString('base64');

	var html = 'Motion: ' + frame.stats.motion + '<br><br>';
	html += `<img src="cid:image.jpg">`;

	return sendEmail({
		to: config.mailer.to,
		from: config.mailer.from,
		subject: 'Sentry Camera Motion: ' + camera.name,
		html,
		attachments: [{
			cid: 'cid:image.jpg',
			filename: 'image.jpg',
			path: `data:image/jpeg;base64,${image}`
		}]
	});
}

