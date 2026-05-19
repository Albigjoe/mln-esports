const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const res = await fetch('https://mlbb-wiki-api.vercel.app/api/heroes');
    if (!res.ok) {
      console.error("Failed to fetch, status:", res.status);
      return;
    }
    const body = await res.json();
    if (!body.success || !body.data) {
      console.error("Invalid response body");
      return;
    }
    
    const mapping = {};
    body.data.forEach(hero => {
      if (hero.hero_name && hero.icon) {
        // Format key to match normalized naming
        const key = hero.hero_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        mapping[key] = hero.icon;
      }
    });

    // Write to src/lib/hero_images.json
    const dest = path.join(__dirname, '../src/lib/hero_images.json');
    fs.writeFileSync(dest, JSON.stringify(mapping, null, 2), 'utf-8');
    console.log("Successfully wrote", Object.keys(mapping).length, "hero mappings to", dest);
  } catch (e) {
    console.error(e);
  }
}

run();
