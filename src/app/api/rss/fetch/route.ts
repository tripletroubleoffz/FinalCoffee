import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { Client } from 'pg';
import dns from 'dns';
import net from 'net';

// Force DNS resolution to prioritize IPv4 over IPv6.
// GitHub Actions runners do not support IPv6 outbound routing, which causes connection timeouts (ENETUNREACH) to Supabase hosts.
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
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

export async function POST(req: NextRequest) {
  // Validate authorization token if a secret key is defined in environment variables
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[RSS Ingestion] Unauthorized fetch attempt.');
    return NextResponse.json({ success: false, error: 'Unauthorized access token.' }, { status: 401 });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[RSS Ingestion] DATABASE_URL env variable is not set. Skipping DB operations.');
    return NextResponse.json({ 
      success: false, 
      message: 'DATABASE_URL environment variable is not defined.' 
    }, { status: 500 });
  }

  // Register media:content and media:thumbnail as custom fields so rss-parser
  // exposes them on each item (used by TechCrunch, The Verge, Reuters, etc.).
  // Also set browser-like headers so servers that block bot User-Agents (e.g. InfoQ 406)
  // accept our requests.
  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
    customFields: {
      item: [
        ['media:content',   'mediaContent',   { keepArray: false }],
        ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ]
    }
  });
  const pgClient = new Client({ 
    connectionString,
    stream: (opts: any) => {
      return net.connect({
        ...opts,
        lookup: (hostname: any, dnsOpts: any, callback: any) => {
          dns.lookup(hostname, { family: 4 }, callback);
        }
      });
    }
  } as any);
  
  let totalImported = 0;
  let hasErrors = false;
  let errorMessage = '';
 
  try {
    await pgClient.connect();
    
    // Storage cleanup runs at most once every 5 days.
    // Check when the last cleanup was performed by looking at a dedicated log entry.
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const lastCleanupRes = await pgClient.query(
      `SELECT created_at FROM public.rss_ingestion_logs
       WHERE status = 'CLEANUP'
       ORDER BY created_at DESC
       LIMIT 1`
    );

    const lastCleanupAt: Date | null = lastCleanupRes.rows[0]?.created_at ?? null;
    const shouldCleanup = !lastCleanupAt || lastCleanupAt < fiveDaysAgo;

    if (shouldCleanup) {
      // Delete unsaved articles older than the start of the previous month
      const cutoffDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));

      console.log(`[Storage Cleanup] Running cleanup. Deleting unsaved articles older than ${cutoffDate.toISOString()}...`);
      const cleanupRes = await pgClient.query(
        `DELETE FROM public.articles a 
         WHERE a.created_at < $1 
         AND NOT EXISTS (
           SELECT 1 FROM public.saved_articles s 
           WHERE s.article_id = a.id
         )`,
        [cutoffDate]
      );
      console.log(`[Storage Cleanup] Done. Removed ${cleanupRes.rowCount} expired unsaved articles.`);

      // Record that a cleanup was performed
      await pgClient.query(
        `INSERT INTO public.rss_ingestion_logs (status, items_imported, error_message)
         VALUES ('CLEANUP', 0, NULL)`
      );
    } else {
      console.log(`[Storage Cleanup] Skipped — last cleanup was ${lastCleanupAt?.toISOString()}. Next cleanup due after ${new Date(lastCleanupAt!.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()}.`);
    }

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

                // ── Image: priority order ──────────────────────────────────────────
                // 1. media:content / media:thumbnail  (TechCrunch, Verge, Reuters…)
                // 2. RSS <enclosure> tag
                // 3. <img> embedded in the raw RSS content snippet
                // 4. og:image scraped from the article page (fallback, see below)
                const mc = (item as any).mediaContent;
                const mt = (item as any).mediaThumbnail;
                let image_url: string | null = null;

                if (mc && mc.$ && mc.$.url) {
                  image_url = decodeHTMLEntities(mc.$.url);
                } else if (mt && mt.$ && mt.$.url) {
                  image_url = decodeHTMLEntities(mt.$.url);
                } else if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
                  image_url = decodeHTMLEntities(item.enclosure.url);
                } else {
                  const imgMatch = rawContent.match(/<img[^\>]+src="([^"\>]+)"/);
                  if (imgMatch && imgMatch[1]) {
                    image_url = decodeHTMLEntities(imgMatch[1]);
                  }
                }

                const summary = cleanAndFormatText(rawSummary);
                let content = cleanAndFormatText(rawContent);

                // Scrape the article page when:
                //   • content is too short (< 500 chars), OR
                //   • we still have no image (og:image is the most reliable fallback)
                // Both needs are handled in a single fetch to avoid double requests.
                if (content.length < 500 || !image_url) {
                  const scraped = await scrapeArticleData(link);
                  if (scraped.content.length >= 500) {
                    content = scraped.content;
                  }
                  // Use scraped og:image only when RSS provided nothing
                  if (!image_url && scraped.imageUrl) {
                    image_url = scraped.imageUrl;
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
              // Check if an article with the exact headline already exists
              const checkRes = await pgClient.query(
                'SELECT id, image_url FROM public.articles WHERE headline = $1 LIMIT 1',
                [item.headline]
              );

              const summaryText = item.summary.substring(0, 1000);

              if (checkRes.rowCount && checkRes.rowCount > 0) {
                // Update existing article
                const existingArticle = checkRes.rows[0];
                const resolvedImageUrl = item.image_url || existingArticle.image_url;

                await pgClient.query(
                  `UPDATE public.articles 
                   SET category = $1, summary = $2, content = $3, image_url = $4 
                   WHERE id = $5`,
                  [
                    item.category,
                    summaryText,
                    item.content,
                    resolvedImageUrl,
                    existingArticle.id
                  ]
                );
              } else {
                // Insert new article
                await pgClient.query(
                  `INSERT INTO public.articles (category, headline, summary, content, image_url, created_at, likes_count)
                   VALUES ($1, $2, $3, $4, $5, $6, 0)`,
                  [
                    item.category,
                    item.headline,
                    summaryText,
                    item.content,
                    item.image_url,
                    item.created_at
                  ]
                );
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
    let status: 'SUCCESS' | 'PARTIAL' | 'FAILURE';
    if (!hasErrors) {
      status = 'SUCCESS';
    } else if (totalImported > 0) {
      status = 'PARTIAL';
    } else {
      status = 'FAILURE';
    }

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

export async function GET(req: NextRequest) {
  // Support GET triggers for cron schedulers
  return POST(req);
}
