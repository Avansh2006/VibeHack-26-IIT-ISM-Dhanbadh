import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

const previewUrl = process.env.CLICKPOCALYPSE_PREVIEW_URL ?? 'http://127.0.0.1:4173';
const screenshotDir = process.env.CLICKPOCALYPSE_SCREENSHOT_DIR ?? process.cwd();

const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const browserPath = browserCandidates.find((candidate) => existsSync(candidate));

const port = await findFreePort();
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'clickpocalypse-gallery-'));
const profileDirectory = path.join(temporaryRoot, 'profile');
const browserArguments = [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--disable-default-apps',
  '--autoplay-policy=no-user-gesture-required',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDirectory}`,
  '--window-size=1440,900',
  previewUrl,
];

const browser = spawn(browserPath, browserArguments, { stdio: 'ignore', windowsHide: true });
let socket;

try {
  const target = await waitForTarget(port);
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  const send = createCdpSender(socket);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: previewUrl });
  await new Promise((resolve) => setTimeout(resolve, 800));

  const runCode = async (expr) => {
    return (
      await send('Runtime.evaluate', {
        awaitPromise: true,
        returnByValue: true,
        expression: expr,
      })
    ).result?.value;
  };

  const capture = async (name) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(screenshotDir, `${name}.png`);
    await writeFile(fullPath, Buffer.from(shot.data, 'base64'));
    process.stdout.write(`Captured: ${name}.png\n`);
  };

  // Skip through to Courtroom
  await runCode(`
    (async () => {
      const pause = (d = 90) => new Promise((r) => setTimeout(r, d));
      const click = async (label) => {
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
          const el = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(label));
          if (el) { el.click(); await pause(150); return; }
          await pause(40);
        }
      };
      await click('Begin responsible clicking');
      await click('That proves nothing');
      await click('Inspect the alleged evidence');
      await click('Request emergency exit');
      await click('Use the totally normal exit');
      await click('Catch the emergency exit');
      await click('File an appeal');
      await click('button looked emotionally available');
      await click('lawyer who understands CSS');
      await click('Weather is not admissible evidence');
      await click('Test structural integrity');
      await click('Decline pixel demands');
      await click('PROVE MY INNOCENCE');
      await pause(1500);
      await click('Face the extremely online judge');
      await pause(600);
    })()
  `);
  await capture('courtroom-01-evidence');

  // Defense
  await runCode(`
    (async () => {
      const click = async (label) => {
        const el = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(label));
        if (el) el.click();
      };
      await click('Attempt a legally questionable defense');
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));
  await capture('courtroom-02-defense');

  // Choose defense -> Objection -> Verdict
  await runCode(`
    (async () => {
      const click = async (label) => {
        const el = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(label));
        if (el) el.click();
      };
      await click('I was framed by JavaScript');
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('courtroom-03-objection');

  // Wait for verdict
  await new Promise((r) => setTimeout(r, 2200));
  await capture('courtroom-04-verdict');

  // Open Punishment Roulette
  await runCode(`
    (async () => {
      const el = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Spin the Punishment Roulette'));
      if (el) el.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('courtroom-05-roulette');

  // Open Mud of Shame
  await runCode(`
    (async () => {
      const el = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Serve Punishment: Mud of Shame'));
      if (el) el.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await capture('courtroom-06-mud-of-shame');

  // Trigger Appeal Twist
  await runCode(`
    (async () => {
      const el = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('File an Immediate Appeal'));
      if (el) el.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('courtroom-07-appeal-denied');
} finally {
  if (socket) socket.close();
  browser.kill();
  await rm(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
}

function createCdpSender(activeSocket) {
  let counter = 0;
  const pendingRequests = new Map();
  activeSocket.addEventListener('message', (event) => {
    const payload = JSON.parse(event.data.toString());
    if (payload.id && pendingRequests.has(payload.id)) {
      const { resolve, reject } = pendingRequests.get(payload.id);
      pendingRequests.delete(payload.id);
      if (payload.error) reject(new Error(payload.error.message));
      else resolve(payload.result);
    }
  });

  return (method, params = {}) =>
    new Promise((resolve, reject) => {
      counter += 1;
      const id = counter;
      pendingRequests.set(id, { resolve, reject });
      activeSocket.send(JSON.stringify({ id, method, params }));
    });
}

async function findFreePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  const freePort = typeof address === 'object' && address ? address.port : 9222;
  await new Promise((resolve) => server.close(resolve));
  return freePort;
}

async function waitForTarget(debugPort) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        const pageTarget = targets.find((t) => t.type === 'page');
        if (pageTarget) return pageTarget;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for Chrome target.');
}
