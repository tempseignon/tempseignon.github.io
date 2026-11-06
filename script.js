// script.js — Appointed vs. Resigned by year, audited agencies only

// ===== EDIT THIS LIST ONLY =====
// label = what shows in the dropdown, keywords = text to look for in the agency name
const AGENCIES = [
  { label: "Campaign Finance Board", keywords: ["CAMPAIGN FINANCE"] },
  { label: "Borough President Offices", keywords: ["BOROUGH PRESIDENT"] },
  { label: "Comptroller", keywords: ["COMPTROLLER"] },
  { label: "Emergency Management", keywords: ["EMERGENCY MANAGEMENT"] },
  { label: "Social Services (HRA/DHS)", keywords: ["SOCIAL SERVICES"] },
  { label: "City Clerk", keywords: ["CITY CLERK"] },
  { label: "Cultural Affairs", keywords: ["CULTURAL AFFAIRS"] },
  { label: "Payroll Administration (FISA/OPA)", keywords: ["PAYROLL ADMIN", "FINANCIAL INFORMATION"] },
  { label: "Landmarks Preservation Commission", keywords: ["LANDMARKS"] },
  { label: "Office of Collective Bargaining", keywords: ["COLLECTIVE BARGAINING"] },
  { label: "Department of Buildings", keywords: ["BUILDINGS"] },
  { label: "Health and Mental Hygiene", keywords: ["MENTAL HYGIENE"] },
  { label: "Business Integrity Commission", keywords: ["BUSINESS INTEGRITY"] },
  { label: "Records and Information Services", keywords: ["RECORDS"] }
];
const START_AT = 10; // which one shows first (10 = Department of Buildings)
// ================================

const BASE = "https://data.cityofnewyork.us/resource/dg92-zbpx.json?";
let chart = null;

async function drawChart(agency) {
  const loading = document.getElementById("loadingMsg");
  loading.style.display = "block";
  loading.textContent = "Loading live data…";
  document.getElementById("agencyName").textContent = agency.label.toUpperCase();

  const match = agency.keywords
    .map(k => `upper(agency_name) like '%${k}%'`)
    .join(" OR ");

  const params = new URLSearchParams({
    "$select": "date_extract_y(end_date) as yr, short_title, count(*) as n",
    "$where": `section_name='Changes in Personnel' AND (${match}) AND end_date>='2020-01-01T00:00:00' AND short_title in('APPOINTED','RESIGNED')`,
    "$group": "yr, short_title",
    "$order": "yr"
  });

  try {
    const res = await fetch(BASE + params);
    if (!res.ok) throw new Error("API error " + res.status);
    const rows = await res.json();

    if (chart) { chart.destroy(); chart = null; }

    if (rows.length === 0) {
      loading.textContent = "No appointment or resignation notices found since 2020 for this agency. The name may be spelled differently in the data, or it may not publish personnel notices here.";
      return;
    }

    const years = [...new Set(rows.map(r => r.yr))].sort();
    const countFor = (title) => years.map(y => {
      const r = rows.find(r => r.yr === y && r.short_title === title);
      return r ? Number(r.n) : 0;
    });

    chart = new Chart(document.getElementById("analysisChart"), {
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

    loading.style.display = "none";
  } catch (err) {
    loading.textContent = "Couldn't load live data right now.";
    console.error(err);
  }
}

function init() {
  const picker = document.getElementById("agencyPicker");
  AGENCIES.forEach((a, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = a.label;
    picker.appendChild(opt);
  });
  picker.value = START_AT;
  picker.addEventListener("change", () => drawChart(AGENCIES[picker.value]));
  drawChart(AGENCIES[START_AT]);
}

document.addEventListener("DOMContentLoaded", init);
