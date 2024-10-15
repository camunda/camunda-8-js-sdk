import {registerCompletionHandler} from 'ava'; // eslint-disable-line ava/use-test
import {cleanUp} from './helpers/cleanup.js';

registerCompletionHandler(() => {
	cleanUp();
});
