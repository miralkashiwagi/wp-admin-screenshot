const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const COOKIES_PATH = "./cookies.json";
const ADMIN_URL = `${process.env.WP_URL}/wp-admin/`;
const PAGES_URL = `${process.env.WP_URL}/wp-admin/edit.php?post_type=page`;

const CUSTOM_CSS = `
.block-editor__container,
.interface-interface-skeleton{
position:static;
}

.interface-interface-skeleton__body,
.interface-interface-skeleton__content,
.interface-interface-skeleton__editor{
overflow:initial;
}
`;

async function captureScreenshotsHeadless() {
    const browser = await puppeteer.launch({
        headless:true,
        defaultViewport: {
            width: 1200,
            height: 800
        },
    });

    const page = await browser.newPage();

    try {
        await loadCookies(page);
        await ensureLoggedIn(page);
        await capturePageScreenshots(page);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

async function loadCookies(page) {
    try {
        const cookiesString = await fs.readFile(COOKIES_PATH);
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
        console.log('Cookies loaded');
    } catch (error) {
        console.log('No cookies found, proceeding with login');
    }
}

async function ensureLoggedIn(page) {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle0' });
    if (page.url().includes('wp-login.php')) {
        throw new Error('Login failed or session expired. Please run the login task first.');
    }
}

async function capturePageScreenshots(page) {
    await page.goto(PAGES_URL, { waitUntil: 'networkidle0' });
    const pageIds = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('tbody#the-list tr.type-page.status-publish'));
        return rows.map(row => row.id.replace('post-', ''));
    });

    console.log(`Found ${pageIds.length} pages`);

    let screenshotCounter = 1;
    for (const pageId of pageIds) {
        const formattedCounter = String(screenshotCounter).padStart(3, '0');
        const editUrl = `${process.env.WP_URL}/wp-admin/post.php?post=${pageId}&action=edit`;
        await page.goto(editUrl);

        await injectCustomCSS(page);
        await wait(page, 1000);

        const screenshotPath = path.join(__dirname, 'screenshots', `${formattedCounter}_page-${pageId}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Captured screenshot for page ID: ${pageId}`);

        screenshotCounter++;
    }
}

async function injectCustomCSS(page) {
    await page.evaluate((css) => {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }, CUSTOM_CSS);
}

async function wait(page, ms) {
    await page.evaluate(ms => new Promise(resolve => setTimeout(resolve, ms)), ms);
}

captureScreenshotsHeadless().catch(console.error);
