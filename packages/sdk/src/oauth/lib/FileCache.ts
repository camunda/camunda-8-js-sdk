import * as fs from 'fs'
import * as os from 'os'
import path from 'path'

import { debug } from 'debug'

import { CamundaPlatform8Configuration } from '../../lib'

const trace = debug('camunda:oauth')

interface IFileCacheProvider {
	get(key: string): Token | null
	set(key: string, token: Token, decoded: { exp?: number }): void
	delete(key: string): void
	flush(): void
}

export interface Token {
	access_token: string
	scope: string
	expires_in: number
	token_type: string
	expiry: number
	audience: string
}

export class FileCache implements IFileCacheProvider {
	private readonly defaultTokenCache = `${os.homedir()}/.camunda`
	private cacheDir: string

	constructor(config?: Partial<CamundaPlatform8Configuration>) {
		this.cacheDir = config?.CAMUNDA_TOKEN_CACHE_DIR || this.defaultTokenCache
		try {
			if (!fs.existsSync(this.cacheDir)) {
				fs.mkdirSync(this.cacheDir, {
					recursive: true,
				})
			}
			// Try to write a temporary file to the directory
			const tempfilename = path.join(this.cacheDir, 'temp.txt')
			if (fs.existsSync(tempfilename)) {
				fs.unlinkSync(tempfilename) // Remove the temporary file
			}
			fs.writeFileSync(tempfilename, 'test')
			fs.unlinkSync(tempfilename) // Remove the temporary file
		} catch (e) {
			throw new Error(
				`FATAL: Cannot write to OAuth cache dir ${this.cacheDir}\n` +
					'If you are running on AWS Lambda, set the HOME environment variable of your lambda function to /tmp'
			)
		}
	}

	get(key: string, refreshWindow = 20000): Token | null {
		let token: Token
		const tokenFileName = this.getCachedTokenFileName(key)
		const tokenCachedInFile = fs.existsSync(tokenFileName)
		if (!tokenCachedInFile) {
			trace(`No file cached token for ${key} found`)
			return null
		}
		try {
			trace(`Reading file cached token for ${key}`)
			token = JSON.parse(
				fs.readFileSync(this.getCachedTokenFileName(key), 'utf8')
			)

			if (OAuthProvider.isTokenExpired(token, refreshWindow)) {
				return null
			}
			return token
		} catch (_) {
			return null
		}
	}

	set(key: string, token: Token, decoded: { exp?: number }): void {
		const file = this.getCachedTokenFileName(key)

		fs.writeFile(
			file,
			JSON.stringify({
				...token,
				expiry: decoded.exp ?? 0,
			}),
			(e) => {
				if (!e) {
					trace(`Wrote OAuth token to file ${file}`)
					return
				}
				// tslint:disable-next-line
				console.error('Error writing OAuth token to file' + file)
				// tslint:disable-next-line
				console.error(e)
			}
		)
	}

	delete(key: string): void {
		const filename = this.getCachedTokenFileName(key)
		if (fs.existsSync(filename)) {
			fs.unlinkSync(filename)
		}
	}

	flush() {
		fs.readdirSync(this.cacheDir).forEach((file) => {
			if (fs.existsSync(file)) {
				fs.unlinkSync(file)
			}
		})
	}

	private getCachedTokenFileName = (key: string) =>
		path.join(`${this.cacheDir}`, `oauth-token-${key}.json`)
}
