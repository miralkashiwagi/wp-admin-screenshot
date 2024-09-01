const puppeteer = require('puppeteer');
const fs = require('fs').promises;
require('dotenv').config();

const COOKIES_PATH = "./cookies.json";
const LOGIN_URL = `${process.env.WP_URL}${process.env.WP_LOGIN_PATH}`;
const ADMIN_URL = `${process.env.WP_URL}/wp-admin/`;

async function loginAndSaveCookies() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });
        await page.type('#user_login', process.env.WP_USERNAME);
        await page.type('#user_pass', process.env.WP_PASSWORD);

        // CAPTCHAの存在を確認
        const hasCaptcha = await page.evaluate(() => {
            return !!document.querySelector('#siteguard_captcha');
        });

        if (hasCaptcha) {
            console.log('CAPTCHA detected. Please complete the CAPTCHA and click the login button manually.');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        } else {
            await Promise.all([
                page.click('#wp-submit'),
                page.waitForNavigation({ waitUntil: 'networkidle0' })
            ]);
        }

        console.log("Current URL after login:", page.url());

        if (!page.url().includes('/wp-admin/')) {
            throw new Error('Login failed. Please check your credentials.');
        }

        console.log('Login successful');
        await saveCookies(page);
    } catch (error) {
        console.error('An error occurred during login:', error);
    } finally {
        await browser.close();
    }
}

async function saveCookies(page) {
    const cookies = await page.cookies();
    await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved');
}

loginAndSaveCookies().catch(console.error);
