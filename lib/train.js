import { load } from "cheerio";

let parseHTMLTableElem = (tableEl) => {
    // https://gist.github.com/johannesjo/6b11ef072a0cb467cc93a885b5a1c19f?permalink_comment_id=3852175#gistcomment-3852175
    let tableLoad = load(tableEl);
    let columns = [
        "numer",
        "data",
        "relacja",
        "stacja",
        "przyjazd",
        "przyjazd_opo",
        "odjazd",
        "odjazd_opo",
        "current"
    ];
    let rows = tableLoad("tbody > tr");

    return rows
        .map((i, row) => {
            let c = tableLoad(row);
            let cells = c.find("td");
            return columns.reduce((obj, col, idx) => {
                let table = tableLoad(cells[idx]);
                if (idx === 3) obj[col] = table["0"].children[1].children[0].attribs.href.split("=")[2];
                if (idx === 8) obj[col] = c.hasClass("current");
                else obj[col] = table.text().trim();
                return obj;
            }, {});
        })
        .toArray();
};

let getTrain = async (id) => {
    let res = await fetch(
        `https://infopasazer.intercity.pl/?p=train&id=${id}`
    ).then(res => res.text()).catch(() => "");

    let $ = load(res);
    let table = $(
        "body > div > div > div > div > div:nth-child(4) > div > div:nth-child(3) > div > div"
    )?.html();

    if (!table) {
        throw new Error("No train found.");
    }

    let data = parseHTMLTableElem(table);

    let final = data.map((x) => {
        let { data, stacja, przyjazd, przyjazd_opo, odjazd, odjazd_opo, current } = x;

        let arrival_delay = przyjazd_opo.split(" ")[0] * 60;
        let departure_delay = odjazd_opo.split(" ")[0] * 60;
        let planned_arrival = new Date(`${data.split(".").reverse().join("-")} ${przyjazd} +0200`);
        let planned_departure = new Date(`${data.split(".").reverse().join("-")} ${odjazd} +0200`);

        return {
            station: stacja,
            arrival: planned_arrival?.getTime() ? {
                planned: planned_arrival,
                real: new Date(planned_arrival.getTime() + arrival_delay * 1000),
                delay: arrival_delay
            } : null,
            departure: planned_departure?.getTime() ? {
                planned: planned_departure,
                real: new Date(planned_departure.getTime() + departure_delay * 1000),
                delay: departure_delay
            } : null,
            current
        };
    });

    return final;
};

export default { getTrain };