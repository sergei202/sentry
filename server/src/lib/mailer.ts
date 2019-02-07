import * as nodemailer from 'nodemailer';
import * as postmarkTransport from 'nodemailer-postmark-transport';
// import * as Email from 'email-templates';
import * as path from 'path';
import { config } from '../config';

// const email = new Email({
// 	views: {
// 		root: path.resolve(__dirname,'../../src/','templates/email'),
// 		options: {extension:'handlebars'}
// 	}
// });

export interface MailerOptions {
	to: string;
	from: string;
	cc?: string;
	bcc?: string;
	subject: string;
	text?: string;
	html?: string;
};

var transport = null;
if(config.mailer && config.mailer.postmark) {
	transport = nodemailer.createTransport(postmarkTransport({
		auth: {
			apiKey: config.mailer.postmark
		}
	}));
}

export function sendEmail(options):Promise<MailerOptions> {
	if(!options) return Promise.reject({message:'mail.sendEmail(): Missing options'});
	if(!transport) return Promise.reject({message:'mailer transport not setup'});

	return new Promise((resolve,reject) => {
		transport.sendMail(options, (err,info) => {
			if(err) return reject(err);
			delete options.html;
			// console.log('sendMail() options=%j, info=%j', options, info);
			resolve(info);
		});
	});
}

// export function sendTemplate(tplName:string, options:MailerOptions, data:any) {
// 	// console.log('data: %j, template: %j', data, template);
// 	return email.render(tplName,data).then(html => {
// 		options.html = html;
// 		return sendEmail(options);
// 	});
// }
