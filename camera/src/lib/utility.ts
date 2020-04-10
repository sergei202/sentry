import * as crypto					from 'crypto';
import * as fs						from 'fs';
import * as path					from 'path';

export function hashPassword(string) {
	return crypto.createHash('sha256').update(string).digest('base64');
}

export function serialPromise(items,func) {
	var results = [];
	var i = 0;
	return items.reduce((promise,item) => {
		return promise.then(() => func(item,i++)).then(r => results.push(r));
	}, Promise.resolve()).then(() => results);
}

export function readFile(path:string):Promise<string> {
	return new Promise((resolve,reject) => {
		fs.readFile(path, (err,data) => {
			if(err) return reject(err);
			resolve(data.toString());
		});
	})
}

export function round(v,d=0) {
	d = Math.pow(10,d);
	return Math.round(v*d)/d;
}

// Recursively create a directory if it doesn't exist
export function createDir(dir):Promise<string> {
	// console.log('createDir: %j', dir);
	return new Promise<string>((resolve,reject) => {
		fs.stat(dir, (err,stats) => {
			if(!err) return resolve(dir);
			// console.log('fs.stat err: %j', err);
			if(err.code!=='ENOENT') return reject(err);
			fs.mkdir(dir, (err) => {
				if(!err) {
					console.log('createDir: Created %j', dir);
					return resolve(dir);
				}
				if(err.code!=='ENOENT') return reject(err);
				// console.log('fs.mkdir err: %j', err);
				var parts = dir.split(path.sep);
				parts.pop();
				var parentDir = parts.join(path.sep);
				if(!parentDir) return reject(err);
				createDir(parentDir)
					.then(() => createDir(dir))
					.then(resolve)
					.catch(reject);
			});
		});
	});
}

// Returns stats on a file/dir, used to check if it exists
export function fileStats(file):Promise<fs.Stats|null> {
	return new Promise((resolve,reject) => {
		fs.stat(file, (err,stats) => {
			if(err || !stats) return resolve(null);
			resolve(stats);
		});
	});
}

export function copyFile(src,dest):Promise<void> {
	return new Promise((resolve,reject) => {
		fs.copyFile(src,dest, (err) => {
			if(err) return reject(err);
			resolve();
		});
	});
}
