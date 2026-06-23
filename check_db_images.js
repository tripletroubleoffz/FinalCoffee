const { Client } = require('pg');
const connectionString = 'postgresql://postgres:FilterCoffee@123@db.fqryrrlzajzagixmirpw.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB.');
    const res = await client.query("SELECT id, headline, image_url, created_at FROM public.articles WHERE headline LIKE '%Franklin Templeton%' LIMIT 1");
    if (res.rows.length > 0) {
      const row = res.rows[0];
      console.log(`ID: ${row.id} | HasImage: ${!!row.image_url} | Img: "${row.image_url}" | Title: "${row.headline}"`);
    } else {
      console.log('Article not found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
