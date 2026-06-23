import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

function decodeHTMLEntities(text: string): string {
  return (text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=')
    .replace(/&#\d+;/g, (match) => {
      const code = parseInt(match.match(/\d+/)?.[0] || '0', 10);
      return String.fromCharCode(code);
    });
}

function cleanAndFormatText(text: string): string {
  const decoded = decodeHTMLEntities(text || '');
  let cleaned = decoded.replace(/<[^>]*>/g, '').trim();
  
  // Normalize newlines: collapse multiple breaks into simple paragraph delimiters
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return cleaned;
}

interface ScrapedData {
  content: string;
  imageUrl: string | null;
}

async function scrapeArticleData(url: string): Promise<ScrapedData> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return { content: '', imageUrl: null };
    const html = await res.text();
    
    // 1. Try to extract og:image or twitter:image
    let imageUrl: string | null = null;
    const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^">]+)"/i) || 
                         html.match(/<meta[^>]+content="([^">]+)"[^>]+property="og:image"/i);
    if (ogImageMatch && ogImageMatch[1]) {
      imageUrl = decodeHTMLEntities(ogImageMatch[1].trim());
    } else {
      const twitterImageMatch = html.match(/<meta[^>]+name="twitter:image"[^>]+content="([^">]+)"/i) ||
                                html.match(/<meta[^>]+content="([^">]+)"[^>]+name="twitter:image"/i);
      if (twitterImageMatch && twitterImageMatch[1]) {
        imageUrl = decodeHTMLEntities(twitterImageMatch[1].trim());
      }
    }

    // 2. Locate main content wrapper element if possible to ignore sidebars/footers/headers
    let mainContentHtml = html;
    const containerRegexes = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<div[^>]+(?:class|id)=["'](?:post-content|entry-content|article-content|main-content|post_content|entry_content|article_body|story-body|articleBody|article-body)["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+(?:class|id)=["'](?:content|post|story|article)["'][^>]*>([\s\S]*?)<\/div>/i
    ];
    
    for (const regex of containerRegexes) {
      const match = html.match(regex);
      if (match && match[1] && match[1].length > 600) {
        mainContentHtml = match[1];
        break;
      }
    }

    // 3. Clean script, style, and HTML comments
    let text = mainContentHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
      
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    const paragraphs: string[] = [];
    
    while ((match = paragraphRegex.exec(text)) !== null) {
      const pText = decodeHTMLEntities(match[1].replace(/<[^>]*>/g, '').trim());
      const lowerP = pText.toLowerCase();
      if (
        pText.length > 50 && 
        !lowerP.includes('javascript') && 
        !lowerP.includes('cookie') &&
        !lowerP.includes('subscribe') &&
        !lowerP.includes('terms of service') &&
        !lowerP.includes('privacy policy') &&
        !lowerP.includes('all rights reserved') &&
        !lowerP.includes('sign in') &&
        !lowerP.includes('create account') &&
        !lowerP.includes('follow us') &&
        !lowerP.includes('share this')
      ) {
        paragraphs.push(pText);
      }
    }
    
    const content = paragraphs.join('\n\n').trim();
    return { content, imageUrl };
  } catch (err) {
    console.error(`Failed to scrape article data from ${url}:`, err);
    return { content: '', imageUrl: null };
  }
}

export async function POST() {
  const parser = new Parser();
  const pgClient = new Client({ connectionString });
  
  let totalImported = 0;
  let hasErrors = false;
  let errorMessage = '';
 
  try {
    await pgClient.connect();
    
    // 1. Fetch configured RSS sources
    const { rows: sources } = await pgClient.query(
      'SELECT id, name, url, category FROM public.rss_sources'
    );
 
    if (sources.length === 0) {
      return NextResponse.json({ message: 'No RSS sources configured.', imported: 0 });
    }
 
    // 2. Loop through each source and parse it
    for (const src of sources) {
      try {
        const feed = await parser.parseURL(src.url);
        // Limit to latest 20 items per feed to optimize initial ingestion size
        const itemsToProcess = feed.items.slice(0, 20);

        // Process in chunks of 5 items concurrently to speed up extraction safely
        const batchSize = 5;
        for (let i = 0; i < itemsToProcess.length; i += batchSize) {
          const chunk = itemsToProcess.slice(i, i + batchSize);
          
          // 1. Scrape feed page data concurrently (parallel network requests)
          const scrapedChunk = await Promise.all(
            chunk.map(async (item) => {
              try {
                const headline = item.title || 'Untitled Article';
                const link = item.link || '';
                if (!link) return null;

                const category = src.category || 'Technology';
                const rawSummary = item.contentSnippet || item.summary || item.content || '';
                const rawContent = item.content || item.contentSnippet || rawSummary;

                // Parse image URL from the feed first
                let image_url = null;
                if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
                  image_url = item.enclosure.url;
                } else {
                  const imgMatch = rawContent.match(/<img[^>]+src="([^">]+)"/);
                  if (imgMatch && imgMatch[1]) {
                    image_url = imgMatch[1];
                  }
                }

                const summary = cleanAndFormatText(rawSummary);
                let content = cleanAndFormatText(rawContent);

                // If parsed content is less than 500 characters, scrape it directly from the webpage
                if (content.length < 500) {
                  const scraped = await scrapeArticleData(link);
                  if (scraped.content.length >= 500) {
                    content = scraped.content;
                    if (scraped.imageUrl && !image_url) {
                      image_url = scraped.imageUrl;
                    }
                  }
                }

                // Discard article if summary/content are too short or empty
                if (!summary || summary.length < 180 || !content || content.length < 500) {
                  return null;
                }

                const created_at = item.pubDate ? new Date(item.pubDate) : new Date();

                // Skip articles published before the company start date of June 1, 2026
                if (created_at < new Date('2026-06-01T00:00:00Z')) {
                  return null;
                }

                return {
                  category,
                  headline,
                  summary,
                  content,
                  image_url,
                  link,
                  created_at
                };
              } catch (itemErr: any) {
                console.error(`Failed to parse item from ${src.name} (${item.link}):`, itemErr);
                return null;
              }
            })
          );

          // 2. Perform DB operations sequentially to avoid pg concurrent execution warnings on a single connection client
          for (const item of scrapedChunk) {
            if (!item) continue;
            try {
              const queryText = `
                INSERT INTO public.articles (category, headline, summary, content, image_url, link, created_at, likes_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
                ON CONFLICT (link) DO UPDATE SET
                  category = EXCLUDED.category,
                  headline = EXCLUDED.headline,
                  summary = EXCLUDED.summary,
                  content = EXCLUDED.content,
                  image_url = COALESCE(EXCLUDED.image_url, public.articles.image_url)
                RETURNING id;
              `;

              const res = await pgClient.query(queryText, [
                item.category,
                item.headline,
                item.summary.substring(0, 1000), // Protect database constraint sizing
                item.content,
                item.image_url,
                item.link,
                item.created_at
              ]);

              if (res.rowCount && res.rowCount > 0) {
                totalImported++;
              }
            } catch (dbErr: any) {
              console.error(`Database insertion error for ${item.link}:`, dbErr);
            }
          }
        }
      } catch (feedErr: any) {
        console.error(`Failed to ingest feed from ${src.name} (${src.url}):`, feedErr);
        hasErrors = true;
        errorMessage += `${src.name} error: ${feedErr.message}; `;
      }
    }

    // 3. Log ingestion attempt
    const status = hasErrors && totalImported === 0 ? 'FAILURE' : 'SUCCESS';
    await pgClient.query(
      'INSERT INTO public.rss_ingestion_logs (status, items_imported, error_message) VALUES ($1, $2, $3)',
      [status, totalImported, hasErrors ? errorMessage : null]
    );

    return NextResponse.json({
      success: true,
      status,
      imported: totalImported,
      errors: hasErrors ? errorMessage : null
    });

  } catch (err: any) {
    console.error('Ingestion transaction error:', err);
    
    // Log failure log
    try {
      await pgClient.query(
        'INSERT INTO public.rss_ingestion_logs (status, items_imported, error_message) VALUES ($1, $2, $3)',
        ['FAILURE', 0, err.message]
      );
    } catch (logErr) {
      console.error('Failed to write failure log:', logErr);
    }

    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await pgClient.end();
  }
}

export async function GET() {
  // Support GET triggers for cron schedulers
  return POST();
}
