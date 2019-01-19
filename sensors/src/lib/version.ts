import { readFile } from './utility';
import { resolve } from 'path';

export async function getVersionFromPackageJson(path='../../package.json'):Promise<string> {
	var file = await readFile(resolve(__dirname,path));
	var json = JSON.parse(file);
	return `v${json.version}`;
}
