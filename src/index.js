const puppeteer = require('puppeteer');
const test_id = (new Date()).getTime();
const fs = require('fs');

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

async function screenshot(page, who, action) {
    const now = new Date().toISOString().split('.')[0].replace(/T/g, ' ').replace(' ', '_').replace(/[:-]/g, '');
    await page.screenshot({path: `/debug/${test_id}-${who}-${now}-${action}.png`});
}

function log (who, text) {
    fs.appendFileSync(`/debug/${test_id}-${who}.log`, text + "\n");

    const pad = `                              `;
    who = String(`${pad}${who}`).slice(-pad.length);
    console.log(`${who}\t\t`, text);
}

const selectors = {
    close_audio: "button[aria-label='Close Join audio modal']",
    microphone_button: "button[aria-label='Microphone']",
    listen_only_button: "button[aria-label='Listen only']",
    echo_is_audible_button: "button[aria-label='Echo is audible']",
    user_talking: "button[aria-label$='is talking']"
};

const AUDIO_TIMEOUT = 30;

const browsers = [];

// Browser 1 - microphone
const microphoneBrowser = (async () => {
    try {
        const {argv} = process;
        const JOIN_URL=argv[2];

        const browser = await puppeteer.launch({
            executablePath: 'google-chrome-stable',
            args: [
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--allow-file-access'
            ],
        });
        browsers.push(browser);

        const page = await browser.newPage();
        page
        .on('console', message =>
            log('microphone-browser', `${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
        .on('pageerror', ({ message }) => 
            log('microphone-browser', message)) 
        // .on('response', response =>
        //     log('microphone-browser', `${response.status()} ${response.url()}`))
        .on('requestfailed', request =>
            log('microphone-browser', `${request.failure().errorText} ${request.url()}`));

        await page.goto(JOIN_URL);
        
        await page.waitForSelector(selectors.microphone_button);
        await page.click(selectors.microphone_button);

        await page.waitForSelector(selectors.echo_is_audible_button);
        await page.click(selectors.echo_is_audible_button);

        // Take one screenshot per second
        for(let i = 0; i < AUDIO_TIMEOUT; i ++ ) {
            await screenshot(page, 'broadcaster', `${i}_seconds_after_share`);
            await delay(1000);
        }

    } catch (e) {
        log('microphone-main', `Test ${test_id} result: FAILURE_OTHER`);
        log('microphone-main', `Details: ${e}`);
        process.exit(1);
    }
});

// Browser 2 - listen only
const listenOnlyBrowser = (async () => {
    try {
        const {argv} = process;
        const JOIN_URL=argv[2];

        const browser = await puppeteer.launch({
            executablePath: 'google-chrome-stable',
            args: [
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
        });
        browsers.push(browser);

        const page = await browser.newPage();
        page
        .on('console', message =>
            log('listenonly-browser', `${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
        .on('pageerror', ({ message }) => 
            log('listenonly-browser', message)) 
        // .on('response', response =>
        //     log('listenonly-browser', `${response.status()} ${response.url()}`))
        .on('requestfailed', request =>
            log('listenonly-browser', `${request.failure().errorText} ${request.url()}`));

        await page.goto(JOIN_URL);
        
        // Close audio modal
        log('listenonly-main', 'Wait for listen only button');
        await page.waitForSelector(selectors.listen_only_button);

        log('listenonly-main', 'Click on listen only button');
        await page.click(selectors.listen_only_button);
        
        let testSuccess = false;

        // Wait to see user talking
        for ( let i = 0 ; i<AUDIO_TIMEOUT; i ++) {
            await screenshot(page, 'watcher', `${i}_seconds_after_join`);
            try {
                // Wait for video tag
                await page.waitForSelector(selectors.user_talking, { timeout: 1000 });
                testSuccess = true;
                log('listenonly-main', 'Talking user detected!');
                await delay(10000);
                break;
            } catch (e) {
                log('listenonly-main', 'No user talking yet...');
            }
        }

        // Close browsers
        log('listenonly-main', 'Closing browsers');
        browsers.forEach(browser => browser.close() );

        if(!testSuccess) {
            log('listenonly-main', `Test ${test_id} result: FAILURE`);
            process.exit(1);
        }

        log('listenonly-main', `Test ${test_id} result: SUCCESS`);
        process.exit(0);
    } catch (e) {
        log('listenonly-main', `Test ${test_id} result: FAILURE_OTHER`);
        log('listenonly-main', `Details: ${e}`);
        process.exit(1);
    }
});

microphoneBrowser();
listenOnlyBrowser();
