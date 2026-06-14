#!/usr/bin/env node
/**
 * 同步 package.json 版本号到 manifest.json
 * 在 npm version 后自动执行
 */
const fs = require('fs')
const path = require('path')

const packageJson = require('../package.json')
const manifestPath = path.join(__dirname, '../src/manifest.json')

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
manifest.version = packageJson.version

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`Synced version ${packageJson.version} to manifest.json`)
