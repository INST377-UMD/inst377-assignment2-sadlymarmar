// === for the voice commands ===
function setupVoiceCommands() {
  if (!annyang) {
    console.warn('Annyang not available');
    return;
  }

  const commands = {
    'hello': () => alert('Hello World'),
    'change the color to *color': (color) => {
      document.body.style.backgroundColor = color;
    },
    'navigate to *page': (page) => {
      const lowerPage = page.toLowerCase();
      if (lowerPage.includes('home')) window.location.href = 'main.html';
      else if (lowerPage.includes('stocks')) window.location.href = 'stocks.html';
      else if (lowerPage.includes('dogs')) window.location.href = 'dogs.html';
      else alert('Page not found');
    },
    'lookup *stock': (stock) => {
      const stockInput = document.getElementById('stock-ticker');
      const dayInput = document.getElementById('day-range');
      if (stockInput && dayInput) {
        stockInput.value = stock.toUpperCase();
        dayInput.value = '30';
        if (typeof lookupStock === 'function') lookupStock();
      }
    },
    'load dog breed *breed': (breed) => {
      const buttons = document.querySelectorAll('#breed-buttons button');
      buttons.forEach(btn => {
        if (btn.textContent.toLowerCase() === breed.toLowerCase()) {
          btn.click();
        }
      });
    }
  };

  annyang.addCommands(commands);
  annyang.start();
}

// === Dog Carousel & Breed Info ===
function setupDogComponents() {
  const carousel = document.getElementById('dog-carousel');
  const breedButtonsContainer = document.getElementById('breed-buttons');
  const breedInfoDiv = document.getElementById('breed-info');

  if (!carousel || !breedButtonsContainer || !breedInfoDiv) return;

  // to fetch random dog images for carousel
  fetch('https://dog.ceo/api/breeds/image/random/10')
    .then(res => res.json())
    .then(data => {
      data.message.forEach(imgUrl => {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = "Dog image";
        carousel.appendChild(img);
      });
    })
    .catch(console.error);

  // tofetch breed list 
  fetch('https://api.thedogapi.com/v1/breeds')
    .then(res => res.json())
    .then(breeds => {
      const maxButtons = 20;  // Limit the number of breed buttons
      breeds.slice(0, maxButtons).forEach(breed => {
        const btn = document.createElement('button');
        btn.textContent = breed.name;
        btn.setAttribute('class', 'custom-btn');
        btn.onclick = () => {
          breedInfoDiv.classList.remove('hidden');
          breedInfoDiv.innerHTML = `
            <h3>${breed.name}</h3>
            <p>${breed.temperament || 'No description available'}</p>
            <p>Life Span: ${breed.life_span}</p>
          `;
        };
        breedButtonsContainer.appendChild(btn);
      });
    })
    .catch(console.error);
}

// === Stock Chart & Data Fetch ===
const POLYGON_API_KEY = 'WBJ2u13wwnozzk8kHEe0XKce1vX7U6mm';

const tickerInput = document.getElementById('stock-ticker');
const dayRangeInput = document.getElementById('day-range');
const buttons = document.querySelectorAll('.button-85');
const ctx = document.getElementById('stockChart')?.getContext('2d');
const redditTableBody = document.querySelector('#reddit-table tbody');

let stockChart;

function epochToDate(epoch) {
  const d = new Date(epoch);
  return d.toISOString().split('T')[0];
}

async function fetchStockData(ticker, days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const from = startDate.toISOString().split('T')[0];
  const to = endDate.toISOString().split('T')[0];

  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=120&apiKey=${POLYGON_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    if (!data.results || data.results.length === 0) throw new Error('No data');

    const labels = data.results.map(r => epochToDate(r.t));
    const prices = data.results.map(r => r.c);

    return { labels, prices };
  } catch (e) {
    alert('Failed to fetch stock data for ' + ticker.toUpperCase());
    throw e;
  }
}

function renderChart(labels, prices, ticker) {
  if (!ctx) return;
  if (stockChart) stockChart.destroy();

  stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: ticker.toUpperCase(),
        data: prices,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.1,
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { display: true, title: { display: true, text: 'Date' } },
        y: { display: true, title: { display: true, text: 'Close Price (USD)' } }
      }
    }
  });
}

function lookupStock() {
  const ticker = tickerInput?.value.trim();
  const days = parseInt(dayRangeInput?.value) || 30;

  if (!ticker) {
    alert('Please enter a stock ticker');
    return;
  }

  fetchStockData(ticker, days)
    .then(({ labels, prices }) => renderChart(labels, prices, ticker))
    .catch(console.error);
}

buttons.forEach(button => {
  button.addEventListener('click', lookupStock);
});


if (annyang) {
  annyang.addCommands({
    'lookup *ticker': (ticker) => {
      if (tickerInput && dayRangeInput) {
        tickerInput.value = ticker.toUpperCase();
        dayRangeInput.value = '30';
        lookupStock();
      }
    }
  });
  annyang.start();
}

// === Reddit Stocks (placeholder) ===
async function fetchRedditTopStocks() {
  if (!redditTableBody) return;


  redditTableBody.innerHTML = '';


  const exampleData = [
    { title: 'TSLA up 5%', link: 'https://reddit.com/r/stocks/tsla' },
    { title: 'AAPL strong earnings', link: 'https://reddit.com/r/stocks/aapl' },
  ];

  exampleData.forEach(item => {
    const tr = document.createElement('tr');
    const tdTitle = document.createElement('td');
    const tdLink = document.createElement('td');
    const a = document.createElement('a');
    a.href = item.link;
    a.target = '_blank';
    a.textContent = item.title;
    tdLink.appendChild(a);
    tr.appendChild(tdTitle);
    tr.appendChild(tdLink);
    redditTableBody.appendChild(tr);
  });
}

fetchRedditTopStocks();

// === Quote ===
async function getQuote() {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data = await response.json();
    document.getElementById("quote").textContent = `"${data[0].q}"`;
    document.getElementById("author").textContent = `— ${data[0].a}`;
  } catch (error) {
    document.getElementById("quote").textContent = "Failed to fetch quote.";
    document.getElementById("author").textContent = "";
  }
}


document.addEventListener('DOMContentLoaded', () => {
  setupVoiceCommands();
  setupDogComponents();
  getQuote();
});
