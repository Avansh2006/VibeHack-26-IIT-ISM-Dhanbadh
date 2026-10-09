import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

const previewUrl = process.env.CLICKPOCALYPSE_PREVIEW_URL ?? 'http://127.0.0.1:4173';
const screenshotDir = process.env.CLICKPOCALYPSE_SCREENSHOT_DIR;

const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const browserPath = browserCandidates.find((candidate) => existsSync(candidate));

if (!browserPath) throw new Error('Chrome or Edge was not found for browser verification.');

const port = await findFreePort();
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'clickpocalypse-game-'));
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

  const journeyResult = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        const pause = (duration = 100) => new Promise((resolve) => setTimeout(resolve, duration));
        const click = async (label, selector = 'button') => {
          const deadline = Date.now() + 15000;
          while (Date.now() < deadline) {
            const candidate = [...document.querySelectorAll(selector)].find((element) =>
              element.textContent?.replace(/\\s+/g, ' ').trim().includes(label),
            );
            if (candidate) {
              candidate.click();
              await pause(150);
              return;
            }
            await pause(40);
          }
          throw new Error('Missing control: ' + label);
        };

        // Advance through chaos stages to courtroom
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
        await pause(1600);

        // Courtroom stages
        await click('Face the extremely online judge');
        const openingSteps = [];
        const openingDeadline = Date.now() + 15000;
        while (Date.now() < openingDeadline) {
          const root = document.querySelector('[data-opening-step]');
          const step = root?.getAttribute('data-opening-step');
          if (step && openingSteps.at(-1) !== step) openingSteps.push(step);
          if (step === 'complete') break;
          await pause(40);
        }
        const openingRoot = document.querySelector('[data-opening-step]');
        const openingAudioResult = openingRoot?.getAttribute('data-opening-audio-result');
        const ttsSupported = openingRoot?.getAttribute('data-tts-supported') === 'true';
        await click('Attempt a legally questionable defense');
        await click('I was framed by JavaScript');
        await pause(2500); // Wait for objection -> verdict

        // Enter Punishment Roulette
        await click('Spin the Punishment Roulette');
        await pause(500);

        // Serve Mud of Shame
        await click('Serve Punishment: Mud of Shame');
        await pause(1000);
        const mudPassed = document.body.innerText.includes('Mud of Shame');

        // Roll again in shame
        await click('Roll Again in Shame');
        await pause(600);

        // Trigger appeal
        await click('File an Immediate Appeal');
        await pause(800);
        const appealPassed = document.body.innerText.includes('APPEAL DENIED');

        // Advance to certificate
        await click('Accept Eternal Ban & View Certificate');
        await pause(600);
        const certificatePassed = document.body.innerText.includes('Certified Digital Menace');

        return {
          mudPassed,
          appealPassed,
          certificatePassed,
          hasPunishmentOnCertificate: document.body.innerText.toLowerCase().includes('served punishment'),
          openingSteps,
          openingAudioResult,
          ttsSupported,
        };
      })()
    `,
  });

  const state = journeyResult.result?.value;
  process.stdout.write(`${JSON.stringify({ result: state })}\n`);

  if (
    !state?.mudPassed ||
    !state?.appealPassed ||
    !state?.certificatePassed ||
    !state?.hasPunishmentOnCertificate ||
    !['defendant', 'prosecutor', 'judge', 'complete'].every((step) =>
      state?.openingSteps?.includes(step),
    ) ||
    state?.openingAudioResult !== 'ended' ||
    !state?.ttsSupported
  ) {
    throw new Error('Courtroom interactive comedy game verification failed.');
  }

  // Capture final certificate screenshot
  if (screenshotDir) {
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const finalPath = path.join(screenshotDir, 'screenshot-game-certificate.png');
    await writeFile(finalPath, Buffer.from(screenshot.data, 'base64'));
    process.stdout.write(`Certificate screenshot saved to ${finalPath}\n`);
  }
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
    } catch {
      // Browser target still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for Chrome target.');
}
