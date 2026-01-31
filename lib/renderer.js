/**
 * Puppeteer 渲染模組
 * 載入 HTML 模板，替換變數，渲染成 PNG
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// 共用的瀏覽器實例（效能優化）
let browserInstance = null;

/**
 * 取得或建立瀏覽器實例
 */
async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
    }
    return browserInstance;
}

/**
 * 渲染所有 slides
 * @param {string} template - 模板類型 ("carousel" | "quote")
 * @param {string} backgroundUrl - 背景圖 URL
 * @param {Array} slides - slides 資料陣列
 * @returns {Promise<Array>} - [{buffer, slideIndex, type}]
 */
export async function renderSlides(template, backgroundUrl, slides) {
    const browser = await getBrowser();
    const results = [];

    // 預處理 slides 資料
    const totalSlides = slides.length;
    const coverTitle = slides[0]?.title || slides[0]?.quote || '';

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideData = {
            ...slide,
            slideIndex: i + 1,
            totalSlides,
            backgroundUrl,
            coverTitle
        };

        // 根據 slide type 選擇模板
        const templateFile = getTemplateFile(template, slide.type);
        const html = await buildHtml(templateFile, slideData);

        // 渲染成 PNG
        const buffer = await renderToPng(browser, html);

        results.push({
            buffer,
            slideIndex: i + 1,
            type: slide.type
        });
    }

    return results;
}

/**
 * 根據模板類型和 slide 類型取得對應的 HTML 模板檔案路徑
 */
function getTemplateFile(template, slideType) {
    const mapping = {
        carousel: {
            cover: 'carousel/cover.html',
            content: 'carousel/content.html',
            cta: 'carousel/cta.html'
        },
        quote: {
            'quote-cover': 'quote/cover.html',
            'quote-reflection': 'quote/reflection.html'
        }
    };

    const file = mapping[template]?.[slideType];
    if (!file) {
        throw new Error(`Unknown template/type: ${template}/${slideType}`);
    }
    return path.join(TEMPLATES_DIR, file);
}

/**
 * 讀取模板並替換變數
 */
async function buildHtml(templatePath, data) {
    let html = await fs.readFile(templatePath, 'utf-8');

    // 替換所有 {{variable}} 格式的變數
    html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        if (key in data) {
            let value = data[key];
            // 處理換行符號
            if (typeof value === 'string') {
                value = value.replace(/\n/g, '<br>');
            }
            return value;
        }
        return match;
    });

    // 處理條件渲染 {{#if variable}}...{{/if}}
    html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
        return data[key] ? content : '';
    });

    return html;
}

/**
 * 用 Puppeteer 把 HTML 渲染成 PNG
 */
async function renderToPng(browser, html) {
    const page = await browser.newPage();

    try {
        // 設定 viewport 為 1080x1350 (IG 尺寸)
        await page.setViewport({
            width: 1080,
            height: 1350,
            deviceScaleFactor: 1
        });

        // 載入 HTML
        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // 等待字體載入
        await page.evaluateHandle('document.fonts.ready');

        // 截圖
        const buffer = await page.screenshot({
            type: 'png',
            fullPage: false,
            clip: {
                x: 0,
                y: 0,
                width: 1080,
                height: 1350
            }
        });

        return buffer;
    } finally {
        await page.close();
    }
}

// 應用關閉時清理瀏覽器
process.on('SIGTERM', async () => {
    if (browserInstance) {
        await browserInstance.close();
    }
    process.exit(0);
});
