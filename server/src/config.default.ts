export const config:any = {
	port: 7000,
	mailer: {
		postmark: 'POSTMARK_KEY',
		from: 'sentry@mydomain.com',
		to: 'me@gmail.com'
	},

	users: [
		{name:'User',	username:'user',	password:'asdf'}
	]
};
