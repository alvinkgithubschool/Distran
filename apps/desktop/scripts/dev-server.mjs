import { spawn } from 'node:child_process';
try {
  const response = await fetch('http://127.0.0.1:1420/', { signal: AbortSignal.timeout(1200) });
  if (!(await response.text()).includes('<title>Distran')) {
    console.error('Port 1420 is occupied by another app. Stop it before opening Distran.');
    process.exit(1);
  }
  console.log('Reusing the running Distran frontend on port 1420.');
} catch {
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    stdio: 'inherit',
  });
  child.on('exit', (code) => process.exit(code ?? 0));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
}
