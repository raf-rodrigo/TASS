async function check() {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=-23.5505&longitude=-46.6333&hourly=precipitation_probability&timezone=auto&forecast_days=1';
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
check();
