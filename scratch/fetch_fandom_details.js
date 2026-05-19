const fs = require('fs');
const path = require('path');

const excludeList = new Set([
  'Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank', 'Upcoming', 'Unreleased', 'Heroes',
  'List of heroes', 'List of hero skins', 'Hero', 'Role', 'Attributes', 'Lane', 'Specialty',
  'Gold Lane', 'Exp Lane', 'Jungle', 'Roamer', 'Mid Lane', 'Custom',
  'Cancelled heroes', 'Heavenly Artifacts', 'Lightborn', 'Oriental Fighters', 'S.A.B.E.R.', 'Side Laner', 'V.E.N.O.M.'
]);

async function run() {
  try {
    const rawList = JSON.parse(fs.readFileSync('scratch/fandom_heroes.json', 'utf8'));
    const cleanTitles = rawList.filter(t => !excludeList.has(t) && !t.includes(':') && !t.includes('Category'));
    
    console.log("Filtered to", cleanTitles.length, "possible hero names.");

    // Chunk into groups of 50 for the MediaWiki API
    const chunks = [];
    for (let i = 0; i < cleanTitles.length; i += 50) {
      chunks.push(cleanTitles.slice(i, i + 50));
    }

    const mapping = {};
    const finalHeroNames = [];

    for (const chunk of chunks) {
      const titlesParam = encodeURIComponent(chunk.join('|'));
      const url = `https://mobile-legends.fandom.com/api.php?action=query&prop=pageimages&titles=${titlesParam}&piprop=original&format=json&origin=*`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.query && data.query.pages) {
        Object.values(data.query.pages).forEach((page) => {
          const title = page.title;
          const original = page.original;
          
          if (original && original.source) {
            const imgUrl = original.source;
            const normalizedKey = title.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            mapping[normalizedKey] = imgUrl;
            finalHeroNames.push(title);
          }
        });
      }
    }

    finalHeroNames.sort();
    console.log("Found icons for", finalHeroNames.length, "heroes.");

    // Save mapping to src/lib/hero_images.json
    fs.writeFileSync('src/lib/hero_images.json', JSON.stringify(mapping, null, 2), 'utf8');
    
    // Save the array of names to scratch/final_heroes_list.json
    fs.writeFileSync('scratch/final_heroes_list.json', JSON.stringify(finalHeroNames, null, 2), 'utf8');

    console.log("Successfully wrote all mappings and final lists!");
  } catch (e) {
    console.error(e);
  }
}

run();
