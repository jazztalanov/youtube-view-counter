const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

async function getViews(channel) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(`https://socialblade.com/youtube/user/${channel}`, { waitUntil: 'domcontentloaded' });

  // SocialBlade: Находим нужный div с количеством просмотров
  const views = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.YouTubeUserTopLight')).find(e => e.textContent.includes('Video Views'));
    if (!el) return 0;
    const value = el.querySelector('span').textContent.replace(/,/g, '');
    return Number(value);
  });

  await browser.close();
  return views || 0;
}

app.get('/', async (req, res) => {
  try {
    const channels = ['ildarauto', 'slovopatsana'];
    const results = await Promise.all(channels.map(getViews));
    const totalViews = results.reduce((a, b) => a + b, 0);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ totalViews });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка парсинга' });
  }
});

app.listen(PORT, () => {
  console.log('Сервер стартовал на порту', PORT);
});
