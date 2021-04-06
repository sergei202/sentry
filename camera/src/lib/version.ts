import { readFileSync } from 'fs';
import { resolve } from 'path';

export function getVersionFromPackageJson(path='package.json'):string {
	const file = readFileSync(resolve(__dirname, '../..', path), 'UTF8').toString();
	const json = JSON.parse(file);
	return `v${json.version}`;
}
