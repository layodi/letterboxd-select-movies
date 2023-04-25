require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const numMoviesToSelect = process.argv[2] || 2;

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Navigate to watchlist
  await page.goto(`https://letterboxd.com/${process.env.LETTERBOXD_USERNAME}/watchlist/`, {waitUntil: 'networkidle2'});

  let movies = [];
  let currentPage = 1;
  let hasNextPage = true;
  while (hasNextPage) {
    // Get movies on current page
    const html = await page.content();
    const $ = cheerio.load(html);
    $('.film-poster').each((i, el) => {
      const movie = {};
      movie.title = $(el).attr('data-film-name');
      movie.year = parseInt($(el).attr('data-film-release-year'));
      movies.push(movie);
    });

    // Check if there's a next page
    const nextPageButton = await page.$('a.next:not(.disabled)');
    if (nextPageButton) {
      currentPage++;
      await nextPageButton.click();
      await page.waitForNavigation({waitUntil: 'networkidle2'});
    } else {
      hasNextPage = false;
    }
  }

  // Randomly select movies
  const selectedMovies = [];
  while (selectedMovies.length < numMoviesToSelect && movies.length > 0) {
    const randomIndex = Math.floor(Math.random() * movies.length);
    selectedMovies.push(movies[randomIndex]);
    movies.splice(randomIndex, 1);
  }

  // Print selected movies in order of year of release
  selectedMovies.sort((a, b) => a.year - b.year);
  selectedMovies.forEach(movie => console.log(`${movie.title} (${movie.year})`));

  await browser.close();
})();
