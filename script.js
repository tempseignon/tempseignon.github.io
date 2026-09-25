// script.js

// Financial Analysis dataset uses boro_dist like "(Bx)", "(M)", "(Bk)", "(Q)", "(SI)"
const ANALYSIS_URL = "https://data.cityofnewyork.us/resource/m3tj-a2pb.json?$limit=5000";
const ANALYSIS_BOROUGHS = {
  "(Bx)": "Bronx",
  "(M)": "Manhattan",
  "(Bk)": "Brooklyn",
  "(Q)": "Queens",
  "(SI)": "Staten Island"
};

// Public Funds Payments dataset uses officeboro like "X", "M", "K", "Q", "S"
const PAYMENTS_URL = "https://data.cityofnewyork.us/resource/u69g-mvrb.json?$limit=5000";
const PAYMENTS_BOROUGHS = {
  "X": "Bronx",
  "M": "Manhattan",
  "K": "Brooklyn",
  "Q": "Queens",
  "S": "Staten Island"
};

async function loadDataset(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("API request failed: " + res.status);
  return res.json();
}

function sumByBorough(rows, boroughField, boroughMap, valueField) {
  const totals = {};
  Object.values(boroughMap).forEach(name => totals[name] = 0);

  rows.forEach(row => {
    const code = row[boroughField];
    const name = boroughMap[code];
    if (!name) return; // skip citywide/non-borough rows
    const val = parseFloat(row[valueField]) || 0;
    totals[name] += val;
  });

  return totals;
}

function renderChart(canvasId, totals, label) {
  const labels = Object.keys(totals);
  const values = Object.values(totals);

  new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: values,
        backgroundColor: "#4da6e0",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => "$" + v.toLocaleString()
          }
        }
      }
    }
  });
}

async function init() {
  try {
    const analysisData = await loadDataset(ANALYSIS_URL);
    const analysisTotals = sumByBorough(analysisData, "boro_dist", ANALYSIS_BOROUGHS, "net_cntns");
    renderChart("analysisChart", analysisTotals, "Net Contributions ($)");
    document.getElementById("analysisLoading").style.display = "none";
  } catch (err) {
    document.getElementById("analysisLoading").textContent = "Couldn't load Financial Analysis data right now.";
    console.error(err);
  }

  try {
    const paymentsData = await loadDataset(PAYMENTS_URL);
    const paymentsTotals = sumByBorough(paymentsData, "officeboro", PAYMENTS_BOROUGHS, "totalpay");
    renderChart("paymentsChart", paymentsTotals, "Total Public Funds Paid ($)");
    document.getElementById("paymentsLoading").style.display = "none";
  } catch (err) {
    document.getElementById("paymentsLoading").textContent = "Couldn't load Public Funds Payments data right now.";
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", init);
