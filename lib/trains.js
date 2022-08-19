import { load } from "cheerio";

let parseHTMLTableElem = (tableEl) => {
  // https://gist.github.com/johannesjo/6b11ef072a0cb467cc93a885b5a1c19f?permalink_comment_id=3852175#gistcomment-3852175
  let tableLoad = load(tableEl);
  let columns = [
    "id",
    "numer",
    "przewoznik",
    "data",
    "relacja",
    "odjazd",
    "opoznienie",
  ];
  let rows = tableLoad("tbody > tr");

  return rows
    .map((i, row) => {
      let cells = tableLoad(row).find("td");
      return columns.reduce((obj, col, idx) => {
        if (idx === 0) obj[col] = tableLoad(cells[idx])["0"].children[1].children[0].attribs.href.split("=")[2];
        else obj[col] = tableLoad(cells[idx - 1]).text().trim();
        return obj;
      }, {});
    })
    .toArray();
};

let getTrains = async (id) => {
  let res = await fetch(
    `https://infopasazer.intercity.pl/?p=station&id=${id}`
  ).then(res => res.text()).catch(() => "");

  let $ = load(res);
  let table = $(
    "body > div > div > div > div > div:nth-child(9) > div > div.table--box > div > div"
  )?.html();

  if (!table) {
    throw new Error("No trains found.");
  }

  let data = parseHTMLTableElem(table);

  let final = data.map((x) => {
    let { id, numer, przewoznik, data, relacja, odjazd, opoznienie } = x;

    let delay_seconds = opoznienie.split(" ")[0] * 60;
    let planned_departure = new Date(`${data} ${odjazd} +0200`).getTime();

    return {
      id: id,
      numer: numer,
      carrier: przewoznik,
      departure: {
        planned: planned_departure,
        real: new Date(planned_departure + delay_seconds * 1000),
        delay: delay_seconds
      },
      route: relacja
    };
  });

  return final;
};

export default { getTrains };