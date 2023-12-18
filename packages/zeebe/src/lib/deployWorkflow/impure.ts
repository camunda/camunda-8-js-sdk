import * as fs from 'fs'
import * as path from 'path'

import { either as E } from 'fp-ts'

import { ProcessRequestObject } from '../interfaces-grpc-1.0'

export const readDefinitionFromFile = (
	file: string
): E.Either<string, ProcessRequestObject> =>
	fs.existsSync(file)
		? E.right({
				definition: fs.readFileSync(file),
				name: path.basename(file),
				type: 1,
			})
		: E.left(file)
