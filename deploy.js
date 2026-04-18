#!/usr/bin/env node
import { execSync } from 'child_process'
import { cpSync, rmSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import os from 'os'

const url = process.env.VITE_UIBUILDER_URL || 'can-monitor'

const CONFIG = {
  localTarget:
    process.env.DEPLOY_TARGET_PATH ??
    path.join(os.homedir(), '.node-red', 'uibuilder', url, 'dist'),
  scp: {
    user: process.env.DEPLOY_SCP_USER ?? 'pi',
    host: process.env.DEPLOY_SCP_HOST ?? '192.168.1.100',
    remotePath: process.env.DEPLOY_SCP_PATH ?? `/home/pi/.node-red/uibuilder/${url}/dist`,
  },
}

const usesScp = process.argv.includes('--scp')
const distDir = path.resolve('dist')

console.log('\nBuilding dashboard...')
execSync('npm run build', { stdio: 'inherit' })
console.log('Build complete')

if (usesScp) {
  const { user, host, remotePath } = CONFIG.scp
  console.log(`\nDeploying via SCP to ${user}@${host}:${remotePath}`)
  execSync(`ssh ${user}@${host} "mkdir -p ${remotePath}"`, { stdio: 'inherit' })
  execSync(`scp -r "${distDir}/." "${user}@${host}:${remotePath}"`, { stdio: 'inherit' })
  console.log(`Done: http://${host}:1880/${url}`)
} else {
  console.log(`\nDeploying locally to ${CONFIG.localTarget}`)
  if (!existsSync(CONFIG.localTarget)) {
    mkdirSync(CONFIG.localTarget, { recursive: true })
  }
  rmSync(CONFIG.localTarget, { recursive: true, force: true })
  cpSync(distDir, CONFIG.localTarget, { recursive: true })
  console.log('Local deploy complete')
}
