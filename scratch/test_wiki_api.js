async function test() {
  try {
    const res = await fetch('https://mlbb-wiki-api.vercel.app/api/heroes');
    const data = await res.json();
    console.log("Keys of response:", Object.keys(data));
    if (data.data) {
      console.log("Data size:", data.data.length);
      console.log("Sample:", data.data[0]);
    } else {
      console.log("Response snapshot:", JSON.stringify(data).substring(0, 500));
    }
  } catch (e) {
    console.error(e);
  }
}
test();
