async function check() {
  const url = 'https://cdn.jsdelivr.net/npm/@meteocons/svg@latest/fill/overcast.svg';
  const res = await fetch(url);
  console.log('Status for overcast:', res.status);

  const url2 = 'https://cdn.jsdelivr.net/npm/@meteocons/svg@1.1.0/design/fill/clear-day.svg';
  const res2 = await fetch(url2);
  console.log('Status for clear-day 1.1.0:', res2.status);
}
check();
