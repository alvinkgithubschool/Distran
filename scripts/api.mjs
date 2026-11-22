import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
const python=process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python';
if(!existsSync(python)){console.error('Create the backend environment first: python3 -m venv .venv, then install backend/requirements.txt.');process.exit(1);}
const child=spawn(python,['-m','uvicorn','backend.app.main:app','--host','127.0.0.1','--port','8000'],{stdio:'inherit'});
child.on('exit',code=>process.exit(code??0));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
