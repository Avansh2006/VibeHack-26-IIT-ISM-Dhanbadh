import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

const previewUrl = process.env.CLICKPOCALYPSE_PREVIEW_URL ?? 'http://127.0.0.1:4173';
const reducedMotion = process.env.CLICKPOCALYPSE_REDUCED_MOTION === '1';
const mobileViewport = process.env.CLICKPOCALYPSE_MOBILE === '1';
const screenshotPath = process.env.CLICKPOCALYPSE_SCREENSHOT_PATH;
const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const browserPath = browserCandidates.find((candidate) => existsSync(candidate));

if (!browserPath) throw new Error('Chrome or Edge was not found for browser verification.');

const port = await findFreePort();
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'clickpocalypse-browser-'));
const downloadDirectory = path.join(temporaryRoot, 'downloads');
const profileDirectory = path.join(temporaryRoot, 'profile');
const browserArguments = [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--disable-default-apps',
  '--disable-popup-blocking',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDirectory}`,
  `--window-size=${mobileViewport ? '390,844' : '1440,900'}`,
  ...(reducedMotion ? ['--force-prefers-reduced-motion'] : []),
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
  await send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDirectory,
    eventsEnabled: true,
  });
  await send('Page.navigate', { url: previewUrl });
  await new Promise((resolve) => setTimeout(resolve, 600));
  const journeyResult = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        const pause = (duration = 90) => new Promise((resolve) => setTimeout(resolve, duration));
        const click = async (label, selector = 'button') => {
          const deadline = Date.now() + 5000;
          while (Date.now() < deadline) {
            const candidate = [...document.querySelectorAll(selector)].find((element) =>
              element.textContent?.replace(/\\s+/g, ' ').trim().includes(label),
            );
            if (candidate) {
              candidate.click();
              await pause();
              return;
            }
            await pause(40);
          }
          throw new Error('Missing control: ' + label);
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
        await pause(${screenshotPath ? '3000' : '1400'});
        if (${Boolean(screenshotPath)}) return { courtroomReady: true };
        await click('Face the extremely online judge');
        await click('Attempt a legally questionable defense');
        await click('I was framed by JavaScript');
        await pause(1500);
        await click('Issue my Digital Menace certificate');
        const certificateLink = document.querySelector('a[download]');
        return {
          certificateVisible: document.body.innerText.includes('Certified Digital Menace'),
          certificateHref: certificateLink?.href,
          certificateFilename: certificateLink?.download,
          reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        };
      })()
    `,
  });

  const journeyState = journeyResult.result?.value;
  if (screenshotPath && journeyState?.courtroomReady) {
    const screenshot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    process.stdout.write(
      `${JSON.stringify({ browser: path.basename(browserPath), screenshotPath })}\n`,
    );
    socket.close();
    browser.kill();
    await rm(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
    process.exit(0);
  }
  if (!journeyState?.certificateVisible) {
    throw new Error('The browser journey did not reach the Digital Menace certificate.');
  }
  if (reducedMotion && !journeyState.reducedMotion) {
    throw new Error('Chrome did not activate the requested reduced-motion media preference.');
  }
  if (
    !journeyState.certificateHref?.startsWith('data:image/svg+xml') ||
    !journeyState.certificateFilename?.endsWith('.svg')
  ) {
    throw new Error('The certificate link did not expose a downloadable SVG.');
  }

  const replayResult = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        const replay = [...document.querySelectorAll('button')].find((element) =>
          element.textContent?.includes('Commit another offense'),
        );
        if (!replay) throw new Error('Replay control was not found.');
        replay.click();
        await new Promise((resolve) => setTimeout(resolve, 150));
        return document.body.innerText.includes('System pristine') &&
          document.body.innerText.includes('Begin responsible clicking');
      })()
    `,
  });
  const replayed = replayResult.result?.value === true;
  if (!replayed) throw new Error('Replay did not restore the pristine experience.');

  await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `
      (() => {
        const link = document.createElement('a');
        link.href = ${JSON.stringify(journeyState.certificateHref)};
        link.download = ${JSON.stringify(journeyState.certificateFilename)};
        document.body.append(link);
        setTimeout(() => link.click(), 0);
        return true;
      })()
    `,
  });

  const downloadedFile = await waitForDownload(downloadDirectory);
  const certificate = await readFile(downloadedFile, 'utf8');
  if (!certificate.includes('<svg') || !certificate.includes('CERTIFIED DIGITAL MENACE')) {
    throw new Error('Downloaded certificate did not contain the expected SVG artwork.');
  }

  process.stdout.write(
    `${JSON.stringify({
      browser: path.basename(browserPath),
      downloaded: true,
      mobileViewport,
      reducedMotion: journeyState.reducedMotion,
      replayed,
      filename: path.basename(downloadedFile),
      bytes: Buffer.byteLength(certificate),
    })}\n`,
  );
} finally {
  socket?.close();
  browser.kill();
  if (browser.exitCode === null) {
    await Promise.race([
      once(browser, 'exit'),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  }
  await rm(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
}

async function findFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Unable to reserve a debug port.');
  await new Promise((resolve) => server.close(resolve));
  return address.port;
}

async function waitForTarget(port) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const target = targets.find(
        (item) => item.type === 'page' && item.url.startsWith(previewUrl),
      );
      if (target) return target;
    } catch {
      // Browser debugging endpoint is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for the browser debugging target.');
}

function createCdpSender(cdpSocket) {
  let commandId = 0;
  const pending = new Map();

  cdpSocket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  return (method, params = {}) =>
    new Promise((resolve, reject) => {
      commandId += 1;
      pending.set(commandId, { resolve, reject });
      cdpSocket.send(JSON.stringify({ id: commandId, method, params }));
    });
}

async function waitForDownload(directory) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const filenames = await readdir(directory);
      const completed = filenames.find(
        (filename) => filename.endsWith('.svg') && !filename.endsWith('.crdownload'),
      );
      if (completed) return path.join(directory, completed);
    } catch {
      // Download directory may not exist until the first byte is written.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for the SVG certificate download.');
}
