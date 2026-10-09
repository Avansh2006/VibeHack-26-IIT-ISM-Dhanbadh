import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

const previewUrl = process.env.CLICKPOCALYPSE_PREVIEW_URL ?? 'http://127.0.0.1:4173';
const screenshotDir = process.env.CLICKPOCALYPSE_SCREENSHOT_DIR;
const witnessScreenshotPath = process.env.CLICKPOCALYPSE_WITNESS_SCREENSHOT;
const sceneScreenshotPath = process.env.CLICKPOCALYPSE_SCENE_SCREENSHOT;
const fastMode = process.env.CLICKPOCALYPSE_FAST === '1';
const mobileViewport = process.env.CLICKPOCALYPSE_MOBILE === '1';
const mouseDefense = process.env.CLICKPOCALYPSE_MOUSE_DEFENSE === '1';
const skipMemes = process.env.CLICKPOCALYPSE_SKIP_MEMES === '1';

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
  `--window-size=${mobileViewport ? '390,844' : '1440,900'}`,
  ...(fastMode ? ['--force-prefers-reduced-motion'] : []),
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
        const memeReactions = [];
        const skippedMemeReactions = [];
        const memeObserver = new MutationObserver(() => {
          const reaction = document
            .querySelector('[data-meme-reaction]')
            ?.getAttribute('data-meme-reaction');
          if (reaction && reaction !== 'none' && memeReactions.at(-1) !== reaction) {
            memeReactions.push(reaction);
            if (${skipMemes}) {
              document.querySelector('.meme-reaction > button')?.click();
              skippedMemeReactions.push(reaction);
            }
          }
        });
        memeObserver.observe(document.body, { subtree: true, attributes: true });
        const click = async (label, selector = 'button') => {
          const deadline = Date.now() + 60000;
          while (Date.now() < deadline) {
            const candidate = [...document.querySelectorAll(selector)].find(
              (element) =>
                !element.disabled &&
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
        if (${fastMode}) await click('Mute court');
        await click('Face the extremely online judge');
        const openingSteps = [];
        const openingDeadline = Date.now() + 20000;
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
        const storyPhases = [];
        const witnessLines = [];
        const storyDeadline = Date.now() + 60000;
        while (Date.now() < storyDeadline) {
          const root = document.querySelector('[data-story-phase]');
          const storyPhase = root?.getAttribute('data-story-phase');
          if (storyPhase && storyPhases.at(-1) !== storyPhase) storyPhases.push(storyPhase);
          const subtitle = document.querySelector('.court-subtitle p')?.textContent?.trim();
          if (storyPhase === 'witness' && subtitle && witnessLines.at(-1) !== subtitle) {
            witnessLines.push(subtitle);
          }
          if (
            ${Boolean(process.env.CLICKPOCALYPSE_WITNESS_SCREENSHOT)} &&
            storyPhase === 'witness' &&
            root?.getAttribute('data-active-speaker') === 'girlfriend' &&
            root?.getAttribute('data-witness-ready') === 'true'
          ) {
            await pause(520);
            return {
              witnessCaptureReady: true,
              witnessSpeaker: 'girlfriend',
              witnessReady: root.getAttribute('data-witness-ready'),
            };
          }
          if (storyPhase === 'evidence') break;
          await pause(40);
        }
        const newsResult = document
          .querySelector('[data-news-result]')
          ?.getAttribute('data-news-result');
        await click('Attempt a legally questionable defense');
        await click(${JSON.stringify(mouseDefense ? 'My mouse did it' : 'I was framed by JavaScript')});
        if (${Boolean(process.env.CLICKPOCALYPSE_SCENE_SCREENSHOT)}) {
          const captureDeadline = Date.now() + 60000;
          while (Date.now() < captureDeadline) {
            const root = document.querySelector('[data-story-phase]');
            if (root?.getAttribute('data-story-phase') === 'bribe') {
              await pause(300);
              return { sceneCaptureReady: true, capturedPhase: 'bribe' };
            }
            await pause(40);
          }
          throw new Error('Bribe scene did not become ready for capture.');
        }
        await click('One samosa');
        await click("I'm innocent");
        await click("I'm innocent");
        await click("I'm innocent");
        await click('Begin absurd sentencing');
        await click('404 years buffering');

        // Enter Punishment Roulette
        await pause(500);
        await click('Mud of Shame');

        // Serve Mud of Shame
        await click('Serve Punishment: Mud of Shame');
        await pause(1000);
        const mudPassed = document.body.innerText.includes('Mud of Shame');

        // Roll again in shame
        await click('Roll Again in Shame');
        await pause(600);

        // Trigger appeal
        await click('File an Immediate Appeal');
        const appealDeadline = Date.now() + 30000;
        while (Date.now() < appealDeadline && !document.body.innerText.includes('APPEAL DENIED')) {
          await pause(40);
        }
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
          storyPhases,
          witnessLines,
          newsResult,
          memeReactions,
          skippedMemeReactions,
        };
      })()
    `,
  });

  const state = journeyResult.result?.value;
  if (journeyResult.exceptionDetails) {
    throw new Error(
      journeyResult.exceptionDetails.exception?.description ??
        journeyResult.exceptionDetails.text ??
        'Browser journey threw an unknown exception.',
    );
  }
  process.stdout.write(`${JSON.stringify({ result: state })}\n`);

  if (witnessScreenshotPath && state?.witnessCaptureReady) {
    const screenshot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    await writeFile(witnessScreenshotPath, Buffer.from(screenshot.data, 'base64'));
    process.stdout.write(`Witness screenshot saved to ${witnessScreenshotPath}\n`);
    socket.close();
    browser.kill();
    await rm(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
    process.exit(0);
  }
  if (sceneScreenshotPath && state?.sceneCaptureReady) {
    const screenshot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    await writeFile(sceneScreenshotPath, Buffer.from(screenshot.data, 'base64'));
    process.stdout.write(`Scene screenshot saved to ${sceneScreenshotPath}\n`);
    socket.close();
    browser.kill();
    await rm(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
    process.exit(0);
  }

  if (
    !state?.mudPassed ||
    !state?.appealPassed ||
    !state?.certificatePassed ||
    !state?.hasPunishmentOnCertificate ||
    !['defendant', 'prosecutor', 'judge', 'complete'].every((step) =>
      state?.openingSteps?.includes(step),
    ) ||
    state?.openingAudioResult !== 'ended' ||
    !state?.ttsSupported ||
    !['news', 'witness', 'evidence'].every((phase) => state?.storyPhases?.includes(phase)) ||
    state?.newsResult !== 'ended' ||
    !state?.witnessLines?.some((line) => line.includes('localhost girlfriend')) ||
    !state?.witnessLines?.some((line) => line.includes("couldn't even commit")) ||
    ![
      'innocence-claim',
      'samosa-rebuttal',
      'girlfriend-evidence',
      'girlfriend-breakup',
      'judge-bribe',
      'guilty-verdict',
      'failed-appeal',
    ].every((reaction) => state?.memeReactions?.includes(reaction)) ||
    (mouseDefense && !state?.memeReactions?.includes('unexpected-witness')) ||
    (skipMemes && state?.skippedMemeReactions?.length !== state?.memeReactions?.length)
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
