const cheerio = require('cheerio');
fetch('https://github.com/users/saty62/contributions').then(r=>r.text()).then(html => {
  const $ = cheerio.load(html);
  let activeDays = 0;
  $('[data-level]').each((i, el) => {
    if ($(el).attr('data-level') !== '0') activeDays++;
  });
  console.log('Active Days Last Year:', activeDays);
})
