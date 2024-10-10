import test from 'ava';
import {JSDOM} from 'jsdom';
import {getFilesystem} from '../source/file-system.js';

test('Can write, read, and delete a file in Node.js', async t => {
	const testFile = './testfile';
	const fs = await getFilesystem();
	await fs.writeFile(testFile, 'Something');
	const content = await fs.readFile(testFile);
	t.is(content, 'Something');
	await fs.deleteFile(testFile);
	try {
		await fs.readFile(testFile);
		t.fail('File should have been deleted');
	} catch {
		t.pass('File was deleted');
	}
});

test('Can write, read, and delete a file in the browser', async t => {
	const testFile = './testfile';
	const {window} = new JSDOM('', {url: 'http://localhost'});
	(global as any).window = window;
	(global as any).localStorage = window.localStorage;
	const fs = await getFilesystem();
	await fs.writeFile(testFile, 'Something');
	const content = await fs.readFile(testFile);
	t.is(content, 'Something');
	const exists = fs.existsSync(testFile);
	t.is(exists, true);
	await fs.deleteFile(testFile);
	try {
		await fs.readFile(testFile);
		t.fail('File should have been deleted');
	} catch {
		const exists = fs.existsSync(testFile);
		t.is(exists, false);
		t.pass('File was deleted');
	}
});
