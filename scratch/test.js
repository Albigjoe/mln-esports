async function test() {
  try {
    const res = await fetch('https://www.mobilelegends.com/en/hero');
    const html = await res.text();
    
    // Find all script src
    const srcRegex = /src="([^"]+)"/g;
    let match;
    console.log("Script sources:");
    while ((match = srcRegex.exec(html)) !== null) {
      if (match[1].includes('.js')) {
        console.log(match[1]);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
test();
