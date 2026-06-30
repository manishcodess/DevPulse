const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeGFG(username) {
  try {
    const response = await axios.get(`https://www.geeksforgeeks.org/user/${username}/`);
    const $ = cheerio.load(response.data);
    fs.writeFileSync('gfg.html', response.data);
    console.log("HTML saved to gfg.html");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

scrapeGFG('sandeepjain');
