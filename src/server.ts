
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { writeTerraformProject } from './lib/terraform.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));

// Static assets
app.use('/', express.static(path.join(__dirname, '../public')));
app.use('/client', express.static(path.join(__dirname, './client')));
app.use('/lib', express.static(path.join(__dirname, './lib')));

// API

// Serve the UI at the root path
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, './client/index.html'));
});
app.post('/api/terraform/:action', async (req, res) => {
  try {
    const action = req.params.action as 'plan'|'apply'|'destroy';
    const blocks = req.body?.blocks ?? [];
    const workdir = path.join(process.cwd(), '.tfwork');
    await fs.mkdir(workdir, { recursive: true });

    if (action !== 'destroy') {
      await writeTerraformProject(blocks, workdir);
    }

    // compose terraform commands
    let cmd = ['init'];
    if (action === 'plan') cmd.push('&&','plan','-no-color');
    if (action === 'apply') cmd.push('&&','apply','-auto-approve','-no-color');
    if (action === 'destroy') cmd = ['destroy','-auto-approve','-no-color'];

    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const child = spawn(shell, ['-lc', ['terraform', ...cmd].join(' ')], {
      cwd: workdir,
      env: {
        ...process.env,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
        AWS_PROFILE: process.env.AWS_PROFILE,
        AWS_REGION: process.env.AWS_REGION || 'eu-west-1',
      }
    });

    let output = '';
    child.stdout.on('data', d => output += d.toString());
    child.stderr.on('data', d => output += d.toString());
    child.on('close', () => res.type('text/plain').send(output));
  } catch (e:any) {
    res.status(500).send(String(e?.stack || e));
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`[infra-designer] listening on :${port}`));
