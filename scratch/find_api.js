async function test() {
  try {
    const res = await fetch('https://www.mobilelegends.com/assets/index-6b6511f7.js');
    const text = await res.text();
    
    // Search for API path endpoints like /web/ or /list/ or /hero/
    const pathRegex = /\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/(?:list|hero|detail|info)/gi;
    let match;
    console.log("Searching for endpoints...");
    const endpoints = [];
    while ((match = pathRegex.exec(text)) !== null) {
      endpoints.push(text.substring(match.index - 50, match.index + 100));
    }
    console.log("Found path snippets:", endpoints.slice(0, 20));
  } catch (e) {
    console.error(e);
  }
}
test();
