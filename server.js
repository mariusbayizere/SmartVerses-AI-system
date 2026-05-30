require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Validate env on startup ──
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const BIBLE_KEY     = process.env.BIBLE_API_KEY;

if (!ANTHROPIC_KEY || ANTHROPIC_KEY === 'your-NEW-anthropic-key-here') {
  console.error('\n❌ ERROR: ANTHROPIC_API_KEY is missing in your .env file!');
  console.error('   Open .env and paste your key like this:');
  console.error('   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxx\n');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ── ROUTE: Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', anthropic: true, bible: !!BIBLE_KEY });
});

// ── ROUTE 1: Detect Bible verse references from spoken text ──
app.post('/api/detect', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 5) return res.json({ refs: [] });

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a Bible verse detection AI for live church services.

Analyze this spoken text and detect ANY Bible verse references:
"${text}"

Detect:
- Direct references: "John 3:16", "Psalm 23 verse 1", "the book of Romans chapter 8 verse 28"
- Kinyarwanda: "Yohana 3:16", "Zaburi 23:1"  
- Paraphrases: "for God so loved the world" → John 3:16

Format: "Book Chapter:Verse" — e.g. "John 3:16"

Respond ONLY with JSON, no markdown:
{"refs": ["John 3:16"]}

Nothing detected: {"refs": []}`
      }]
    });

    const raw    = msg.content[0].text.trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    console.log('[detect] found:', parsed.refs);
    return res.json({ refs: Array.isArray(parsed.refs) ? parsed.refs : [] });
  } catch (err) {
    console.error('[detect error]', err.message);
    return res.json({ refs: [] });
  }
});

// ── ROUTE 2: Fetch verse text ──
app.get('/api/verse', async (req, res) => {
  const { ref, version = 'KJV' } = req.query;
  if (!ref) return res.status(400).json({ error: 'ref is required' });

  // Try scripture.api.bible if key present
  if (BIBLE_KEY && BIBLE_KEY !== 'your-bible-api-key-here') {
    const versionIds = {
      KJV: 'de4e12af7f28f599-02', NIV: '06125adad2d5898a-01',
      NLT: '65eec8e0b60e656b-01',  ESV: 'f72b840c855f362c-04',
      NKJV:'55212e3cf5d04d49-01',  ASV: '685d1470fe4d5c3b-01'
    };
    try {
      const bibleId = versionIds[version] || versionIds.KJV;
      const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/search?query=${encodeURIComponent(ref)}&limit=1`;
      const r   = await fetch(url, { headers: { 'api-key': BIBLE_KEY } });
      const d   = await r.json();
      if (d.data?.passages?.length > 0) {
        const p = d.data.passages[0];
        return res.json({
          reference: p.reference,
          text: p.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
          version
        });
      }
    } catch (e) {
      console.warn('[verse] scripture.api.bible failed, using fallback');
    }
  }

  // Fallback: bible-api.com (free, no key needed)
  try {
    const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${version.toLowerCase()}`;
    const r   = await fetch(url);
    const d   = await r.json();
    if (d.error) return res.status(404).json({ error: 'Verse not found: ' + ref });
    console.log('[verse] fetched:', d.reference);
    return res.json({
      reference: d.reference,
      text:      d.text.trim().replace(/\n/g, ' '),
      version,
      verses:    d.verses || []
    });
  } catch (e) {
    console.error('[verse error]', e.message);
    return res.status(500).json({ error: 'Failed to fetch verse' });
  }
});

// ── ROUTE 3: Translate to Kinyarwanda + devotional message ──
app.post('/api/translate', async (req, res) => {
  const { ref, english_text } = req.body;
  if (!ref || !english_text) return res.status(400).json({ error: 'Missing fields' });

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are a professional Kinyarwanda Bible translator for a church in Rwanda.

Reference: ${ref}
English (${req.query?.version || 'KJV'}): "${english_text}"

Tasks:
1. Translate this verse accurately into Kinyarwanda
2. Write a 3-sentence devotional message in English explaining the verse meaning and spiritual significance
3. Write the same devotional message in Kinyarwanda (3 sentences)

Respond ONLY with this exact JSON format, no markdown, no extra text:
{
  "kinyarwanda": "Full Kinyarwanda translation of the verse",
  "message_en": "Full 3-sentence devotional message in English about this verse.",
  "message_rw": "Imirongo itatu y'ubutumwa bw'umwuka mu Kinyarwanda ku murongo uwo."
}`
      }]
    });

    const raw    = msg.content[0].text.trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    console.log('[translate] done:', ref);
    return res.json(parsed);
  } catch (err) {
    console.error('[translate error]', err.message);
    return res.status(500).json({ error: 'Translation failed: ' + err.message });
  }
});

// ── Fallback: serve frontend ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║      SmartVerses AI — Running ✅      ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Open: http://localhost:${PORT}          ║`);
  console.log(`║  Anthropic: ✅ Key loaded               ║`);
  console.log(`║  Bible API: ${BIBLE_KEY ? '✅ Set' : '⚠️  Using free fallback'}              ║`);
  console.log('╚══════════════════════════════════════╝\n');
});
