async function test() {
  try {
    const res = await fetch('https://www.mobilelegends.com/en/hero');
    const html = await res.text();
    console.log("HTML length:", html.length);
    
    // Look for script tags
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let count = 0;
    while ((match = scriptRegex.exec(html)) !== null) {
      const content = match[1];
      if (content.includes('hero') || content.includes('list') || content.includes('data')) {
        console.log(`Script ${count++} snippet:`, content.substring(0, 300));
      }
    }
  } catch (e) {
    console.error(e);
  }
}
test();
