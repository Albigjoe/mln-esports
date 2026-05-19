const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function insertNews() {
  const url = process.env.DATABASE_URL;
  const client = new Client({ connectionString: url });
  
  try {
    await client.connect();
    
    const title = "Reap N Kill (RNK) Wins Nigeria ENC Qualifiers!";
    const slug = "rnk-wins-nigeria-enc-qualifiers";
    const content = `Massive congratulations to Reap N Kill (RNK) for emerging victorious in the Nigeria Esports Nations Cup (ENC) Qualifiers!

After a grueling series of matches against the absolute best squads in Nigeria, RNK proved their dominance and secured the top spot. Their incredible teamwork, drafting strategies, and mechanical skill set them apart from the competition.

**What's Next for RNK?**
By winning the Nigeria qualifiers, Reap N Kill has earned the prestigious honor of representing Nigeria on the continental stage. They will now be competing against other elite African teams for the ultimate prize: the African spot in the Esports Nations Cup (ENC) 2026.

You can learn more about the upcoming ENC Africa matches here:
[Esports Nations Cup 2026 MLBB Info](https://esportsnationscup.com/en/competitions/2026/mlbb)

Let's all rally behind RNK as they carry the Nigerian flag into the African qualifiers. The entire MLN community is rooting for you!`;
    const excerpt = "Reap N Kill secures the top spot in the Nigeria ENC Qualifiers and advances to represent the nation in the upcoming African qualifiers.";
    
    // Insert
    const q = `
      INSERT INTO "BlogPost" (id, title, slug, content, excerpt, category, "imageUrl", published, "authorName", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `;
    const id = 'post_' + Date.now();
    await client.query(q, [id, title, slug, content, excerpt, 'news', '/rnk-lineup.png', true, 'MLN Staff']);
    console.log('News post inserted!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

insertNews();
