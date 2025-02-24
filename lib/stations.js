const { load } = require('cheerio');

module.exports = async (query) => {
  let res = await fetch(
    `http://infopasazer.intercity.pl/?p=stations&q=${query}`
  ).then(res => res.text()).catch(() => "");

  let $ = load(res);

  let table = $(
    "body > div > div > div > div > div.border-bottom.pbl.mtm > div > div.table--box > div > div > table > tbody"
  );

  if (!table) {
    throw new Error("No stations found.");
  }

  let data = table
    .find("td")
    .map((i, el) => {
      return {
        name: $(el).text().trim(),
        id: $(el).attr("onclick").split("'")[1].split("=")[2],
      };
    })
    .toArray();

  return data;
};