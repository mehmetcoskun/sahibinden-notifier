const { Client, Events, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const {
  checkAndSaveCookies,
  parseHtmlAndExtractData,
  loadCookiesFromFile,
  saveDataToFile,
  loadDataFromFile,
  loadUserAgentFromFile,
} = require('./helpers.js');
require('dotenv').config();

puppeteer.use(pluginStealth());

const CHECK_INTERVAL = 3 * 60 * 1000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(
    `[${new Date().toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
    })}]: ${c.user.tag} is ready!`
  );
});

client.login(process.env.DISCORD_TOKEN);

const main = async () => {
  let previousData = await loadDataFromFile();

  await checkAndSaveCookies();

  try {
    const cookies = await loadCookiesFromFile();
    const userAgent = await loadUserAgentFromFile();

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
      executablePath: '/usr/bin/chromium-browser',
    });
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);

    if (cookies) {
      await page.setCookie(...cookies);
    }

    await page.goto(process.env.CATEGORY_URL);

    const html = await page.content();
    const newData = parseHtmlAndExtractData(html);

    if (JSON.stringify(newData) !== JSON.stringify(previousData)) {
      saveDataToFile(newData);
      if (previousData) {
        const changes = newData.filter((item) => {
          return !previousData.some((i) => {
            return i.url === item.url;
          });
        });

        changes.forEach((change) => {
          const embed = {
            title: change.title,
            url: 'https://www.sahibinden.com' + change.url,
            thumbnail: {
              url: change.imageUrl,
            },
            fields: [
              {
                name: 'Metrekare',
                value: change.squareMeter,
                inline: true,
              },
              {
                name: 'Oda Sayısı',
                value: change.roomCount,
                inline: true,
              },
              {
                name: 'Fiyat',
                value: change.price,
                inline: true,
              },
              {
                name: 'Tarih',
                value: change.date.replace(/(\r\n|\n|\r)/gm, ''),
                inline: true,
              },
              {
                name: 'Konum',
                value: change.location,
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: 'Emlakçı Leblebi Sunar',
            },
          };

          client.channels.cache
            .get(process.env.DISCORD_CHANNEL_ID)
            .send({ embeds: [embed] });
        });
      }
    } else {
      console.log('No changes in data.');
    }

    await browser.close();
  } catch (error) {
    console.error('Failed to get data from website.');
  }
};

main();
setInterval(main, CHECK_INTERVAL);
