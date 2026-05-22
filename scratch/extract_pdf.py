import pypdf

try:
    reader = pypdf.PdfReader(r"C:\Users\alawa\Downloads\ml-nigeria-sitemap.pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    with open(r"C:\Users\alawa\.gemini\antigravity\scratch\mln-esports\scratch\sitemap.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("SUCCESS")
except Exception as e:
    print(f"Error: {e}")
