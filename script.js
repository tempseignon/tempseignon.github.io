const AGENCY = "DEPARTMENT OF BUILDINGS"; // change this for each agency

const params = new URLSearchParams({
  "$select": "date_extract_y(end_date) as yr, short_title, count(*) as n",
  "$where": `section_name='Changes in Personnel' AND agency_name='${AGENCY}' AND end_date>='2020-01-01T00:00:00' AND short_title in('APPOINTED','RESIGNED')`,
  "$group": "yr, short_title",
  "$order": "yr"
});
const URL_ = "https://data.cityofnewyork.us/resource/dg92-zbpx.json?" + params;

async function init() {
  const res = await fetch(URL_);
  if (!res.ok) { console.error("API error", res.status); return; }
  const rows = await res.json();

  const years = [...new Set(rows.map(r => r.yr))].sort();
  const countFor = (title) => years.map(y => {
    const r = rows.find(r => r.yr === y && r.short_title === title);
    return r ? Number(r.n) : 0;
  });

  new Chart(document.getElementById("analysisChart"), {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        { label: "Appointed", data: countFor("APPOINTED"), backgroundColor: "#4da6e0" },
        { label: "Resigned", data: countFor("RESIGNED"), backgroundColor: "#e07a4d" }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

document.addEventListener("DOMContentLoaded", init);
