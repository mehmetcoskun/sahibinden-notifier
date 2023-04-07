const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const COOKIES_FILE_PATH = './cookies.json';
const DATA_FILE_PATH = './data.json';
const USER_AGENT_FILE_PATH = './user-agent.txt';

const checkAndSaveCookies = async () => {
  let cookies = await loadCookiesFromFile();

  if (!cookies) {
    return new Promise(async (resolve) => {
      try {
        const response = await axios.post(
          process.env.FLARESOLVERR_URL,
          {
            cmd: 'request.get',
            url: process.env.CATEGORY_URL,
            maxTimeout: 60000,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.data.status === 'ok') {
          cookies = response.data.solution.cookies;
          userAgent = response.data.solution.userAgent;
          saveCookiesToFile(cookies);
          saveUserAgentToFile(userAgent);
        } else {
          console.error('Failed to get cookies from flaresolverr.');
        }
      } catch (error) {
        console.error('Failed to request flaresolverr');
      }

      resolve();
    });
  }
};

const parseHtmlAndExtractData = (html) => {
  const $ = cheerio.load(html);
  const results = [];

  $('.searchResultsItem').each(function () {
    const imageUrl = $(this)
      .find('.searchResultsLargeThumbnail img')
      .attr('src');
    const title = $(this).find('.classifiedTitle').text().trim();
    const url = $(this).find('.classifiedTitle').attr('href');
    const squareMeter = $(this)
      .find('.searchResultsAttributeValue:eq(0)')
      .text()
      .trim();
    const roomCount = $(this)
      .find('.searchResultsAttributeValue:eq(1)')
      .text()
      .trim();
    const price = $(this).find('.searchResultsPriceValue').text().trim();
    const date = $(this).find('.searchResultsDateValue').text().trim();
    const locationElement = $(this).find('.searchResultsLocationValue');

    let location;
    if (locationElement.find('br').length > 0) {
      location = locationElement
        .html()
        .replace(/<br\s*\/?>/g, ', ')
        .trim();
    } else {
      location = locationElement.text().trim();
    }
    const result = {
      imageUrl,
      title,
      url,
      squareMeter,
      roomCount,
      price,
      date,
      location,
    };

    if (imageUrl && title && url && squareMeter && roomCount && price && date) {
      results.push(result);
    }
  });

  return results;
};

const saveCookiesToFile = async (cookies) => {
  if (!fs.existsSync(COOKIES_FILE_PATH)) {
    fs.writeFileSync(COOKIES_FILE_PATH, '');
  }

  fs.writeFileSync(COOKIES_FILE_PATH, JSON.stringify(cookies));
  console.log('Cookies saved to file successfully!');
};

const loadCookiesFromFile = async () => {
  if (!fs.existsSync(COOKIES_FILE_PATH)) {
    fs.writeFileSync(COOKIES_FILE_PATH, '');
  }

  const cookies = fs.readFileSync(COOKIES_FILE_PATH);
  if (cookies && cookies.length > 0) {
    return JSON.parse(cookies);
  }
  return null;
};

const saveDataToFile = async (data) => {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, '');
  }

  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data));
  console.log('Data saved to file successfully!');
};

const loadDataFromFile = async () => {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, '');
  }

  const data = fs.readFileSync(DATA_FILE_PATH);
  if (data && data.length > 0) {
    return JSON.parse(data);
  }
  return null;
};

const saveUserAgentToFile = async (userAgent) => {
  if (!fs.existsSync(USER_AGENT_FILE_PATH)) {
    fs.writeFileSync(USER_AGENT_FILE_PATH, '');
  }

  fs.writeFileSync(USER_AGENT_FILE_PATH, userAgent);
  console.log('User agent saved to file successfully!');
};

const loadUserAgentFromFile = async () => {
  if (!fs.existsSync(USER_AGENT_FILE_PATH)) {
    fs.writeFileSync(USER_AGENT_FILE_PATH, '');
  }

  return new Promise((resolve, reject) => {
    fs.readFile(USER_AGENT_FILE_PATH, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.toString());
      }
    });
  });
};

module.exports = {
  checkAndSaveCookies,
  parseHtmlAndExtractData,
  loadCookiesFromFile,
  saveDataToFile,
  loadDataFromFile,
  loadUserAgentFromFile,
};
