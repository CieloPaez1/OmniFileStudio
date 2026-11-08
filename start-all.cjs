const { spawn } = require('child_process');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');

console.log('==========================================================');
console.log(' Iniciando OmniFile Studio (Proyecto Unificado)');
console.log(' - API REST json-server: http://localhost:3000/files');
console.log(' - App Ionic 9 / Angular: http://localhost:8100');
console.log('==========================================================');

const apiProc = spawn(process.execPath, ['json-server.cjs'], {
  cwd: frontendDir,
  stdio: 'inherit'
});

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const webProc = spawn(npmCmd, ['run', 'ionic'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: isWin
});

function shutdown() {
  apiProc.kill();
  webProc.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
