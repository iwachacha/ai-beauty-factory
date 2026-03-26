'use strict'

const Module = require('node:module')
const path = require('node:path')

const workspaceRoot = path.resolve(__dirname, '..', '..', '..')
const distLibRoot = path.join(workspaceRoot, 'dist', 'libs')

const libNames = [
  'aitoearn-ai-client',
  'aitoearn-auth',
  'aitoearn-queue',
  'aitoearn-server-client',
  'ali-oss',
  'ali-sms',
  'assets',
  'aws-s3',
  'channel-db',
  'common',
  'helpers',
  'mail',
  'mongodb',
  'nest-mcp',
  'redis',
  'redlock',
]

const aliasMap = Object.fromEntries(
  libNames.map(name => [
    `@yikart/${name}`,
    path.join(distLibRoot, name, 'src', 'index.js'),
  ]),
)

const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function resolveBuiltAliases(request, parent, isMain, options) {
  if (Object.prototype.hasOwnProperty.call(aliasMap, request)) {
    return aliasMap[request]
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}
