import fs from 'fs';
import path from 'path';

const logsDir = 'C:\\Users\\alawa\\.gemini\\antigravity\\brain\\b2a8635e-c857-4882-8c0c-88f88e0c9cab\\.system_generated\\logs';
const transcriptPath = path.join(logsDir, 'transcript.jsonl');

if (!fs.existsSync(transcriptPath)) {
  console.error("Transcript file not found at:", transcriptPath);
  process.exit(1);
}

const fileContent = fs.readFileSync(transcriptPath, 'utf8');
const lines = fileContent.split('\n');

console.log("=== SEARCHING TRANSCRIPT FOR INPUTS ===");
lines.forEach((line, idx) => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    
    // Check if the line mentions OCR output, scoreboard, picks, or damage
    const stringified = JSON.stringify(obj);
    if (stringified.includes("damage") || stringified.includes("picks") || stringified.includes("ocrWinner")) {
      console.log(`\n--- Line ${idx} (Type: ${obj.type}, Status: ${obj.status}) ---`);
      if (obj.content) {
        console.log("CONTENT:", obj.content.substring(0, 1000));
      }
      if (obj.tool_calls) {
        console.log("TOOL CALLS:", JSON.stringify(obj.tool_calls, null, 2).substring(0, 2000));
      }
    }
  } catch (e) {
    // Ignore invalid JSON lines
  }
});
