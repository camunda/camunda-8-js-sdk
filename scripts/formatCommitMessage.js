/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// scripts/formatCommitMessage.js
const fs = require('fs')
const os = require('os')

// Get the commit message file path from the arguments
const commitMessageFilePath = process.argv[2]

// Read the commit message
let commitMessage = fs.readFileSync(commitMessageFilePath, 'utf8')

// Break up long lines
commitMessage = commitMessage.replace(/(.{1,100})/g, '$1' + os.EOL)

// Write the formatted commit message back to the file
fs.writeFileSync(commitMessageFilePath, commitMessage)
