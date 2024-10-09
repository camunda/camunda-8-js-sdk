import fs from 'fs'
import path from 'path'

console.log(process.cwd())
const pkg = fs.readFileSync('package.json', 'utf8')
const packageVersion = JSON.parse(pkg).version
const filename = path.join(process.cwd(), 'source', 'packageVersion.ts')
const content = `export const packageVersion = '${packageVersion}'`
fs.writeFileSync(filename, content, 'utf8')
