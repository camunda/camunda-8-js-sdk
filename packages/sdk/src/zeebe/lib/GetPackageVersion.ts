import * as fs from 'fs'
import * as path from 'path'

const packageJsonPath = path.join(__dirname, '..', '..', '..', 'package.json')
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

export const packageVersion = pkg.version
