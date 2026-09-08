/**
 * Start the game and open it in a browser.
 *
 *   pnpm play                # dev server on :5173, opens the browser
 *   pnpm play --preview      # build once, then serve the production bundle on :4173
 *   pnpm play --no-open      # start the server, don't launch a browser
 *   pnpm play --sim          # once it's up, run the playthrough (apps/game/e2e/sim.mjs)
 *
 * Frees the port first, so a stale server from a previous run is not in the way.
 * Ctrl+C stops everything.
 */
import { spawn, execSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const args = new Set(process.argv.slice(2));
const preview = args.has('--preview') || args.has('-p');
const open = !args.has('--no-open');
const runSim = args.has('--sim');

const PORT = preview ? 4173 : 5173;
const URL = `http://localhost:${PORT}/`;
const isWin = process.platform === 'win32';

/** Kill whatever is holding PORT — a dev server left running blocks --strictPort. */
function freePort(port) {
  try {
    if (isWin) {
      const out = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
      const pids = new Set(
        out
          .split('\n')
          .filter((l) => l.includes(`:${port} `) && /LISTENING/i.test(l))
          .map((l) => l.trim().split(/\s+/).pop())
          .filter((p) => p && p !== '0'),
      );
      for (const pid of pids) execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      if (pids.size) console.log(`· freed :${port} (pid ${[...pids].join(', ')})`);
    } else {
      execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: 'ignore', shell: '/bin/sh' });
    }
  } catch {
    /* nothing was listening — fine */
  }
}

/** Poll the port until something answers, or give up. */
async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (res.ok || res.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await sleep(1_000);
  }
  return false;
}

function openBrowser(url) {
  const cmd = isWin ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  try {
    execSync(cmd, { stdio: 'ignore', shell: isWin ? undefined : '/bin/sh' });
  } catch {
    console.log(`· open it yourself: ${url}`);
  }
}

freePort(PORT);

if (preview) {
  console.log('· building the production bundle …');
  execSync('pnpm build', { stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/', MSYS_NO_PATHCONV: '1' } });
}

const cmd = preview ? ['pnpm', 'preview', '--port', '4173', '--strictPort'] : ['pnpm', 'dev'];
console.log(`· starting: ${cmd.join(' ')}`);
const server = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit', shell: isWin });

const stop = () => {
  server.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('exit', (code) => process.exit(code ?? 0));

if (open || runSim) {
  const up = await waitForServer(URL);
  if (!up) {
    console.log('· server did not come up in time');
  } else {
    if (open) {
      console.log(`· opening ${URL}`);
      openBrowser(URL);
    }
    if (runSim) {
      console.log('· running the playthrough …');
      spawn('node', ['apps/game/e2e/sim.mjs'], { stdio: 'inherit', shell: isWin, env: { ...process.env, SIM_URL: URL } });
    }
  }
}
