/* eslint-disable new-cap */
// Create and export an abstraction over fs that supports the browser using zenfs and Node using the native fs module
import {type FSModule} from 'browserfs/dist/node/core/FS.js';
import pify from 'pify';

declare const window;

export async function getFilesystem() {
// eslint-disable-next-line unicorn/no-typeof-undefined
	const fs: any = (typeof window === 'undefined')
	// Node.js environment
		? await (async () => {
			const {promises: nodeFs} = await import('node:fs');
			return nodeFs;
		})()
	// Browser environment (using memfs)
		: await (async () => {
			const BrowserFS = await import('browserfs');
			return new Promise<FSModule>((resolve, reject) => {
				BrowserFS.configure({fs: 'LocalStorage', options: {}}, error => {
					if (error) {
						reject(error);
						return;
					}

					const fs = pify(BrowserFS.BFSRequire('fs')) as unknown as FSModule;
					resolve(fs);
				});
			});
		})();

	return {
		readFile: async (path: string, encoding = 'utf8'): Promise<string> => fs.readFile(path, encoding),
		writeFile: async (path: string, data: string, encoding = 'utf8'): Promise<void> => fs.writeFile(path, data, encoding),
		deleteFile: async (path: string): Promise<void> => fs.unlink(path),
		existsSync: (path: string): boolean => fs.existsSync(path),
	};
}
