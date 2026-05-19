async function test() {
  try {
    const url = 'https://mobile-legends.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Heroes&cmlimit=500&format=json&origin=*';
    const res = await fetch(url);
    const data = await res.json();
    if (data.query && data.query.categorymembers) {
      const heroes = data.query.categorymembers
        .map(c => c.title)
        .filter(t => !t.startsWith('Category:') && !t.startsWith('List of') && !t.includes('/') && !t.includes('Hero'));
      console.log("Fandom returned", heroes.length, "hero page titles.");
      console.log("Sample:", heroes.slice(0, 15));
      
      // Let's write them to scratch/fandom_heroes.json
      const fs = require('fs');
      fs.writeFileSync('scratch/fandom_heroes.json', JSON.stringify(heroes, null, 2));
    } else {
      console.log("Response did not have category members:", data);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
