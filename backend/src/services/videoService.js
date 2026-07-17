const cheerio = require('cheerio');
const { YoutubeTranscript } = require('youtube-transcript');

// Extract YouTube Video ID from any URL format
const extractYtVideoId = (url = '') => {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.trim().match(regExp);
  return (match && match[1] && match[1].length === 11) ? match[1] : null;
};

// Fetch raw HTML and extract open-graph metadata
const fetchUrlMetadata = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    
    return { title, description, html };
  } catch (e) {
    console.warn(`- Failed to fetch metadata for URL: ${url}. Error: ${e.message}`);
    return { title: '', description: '', html: '' };
  }
};

/**
 * Extracts spoken transcript text and metadata from public video URLs
 */
const transcribeVideoUrl = async (url) => {
  console.log(`\n=== INITIATING VIDEO EXTRACTION PIPELINE ===`);
  console.log(`- Target Video URL: "${url}"`);

  const videoId = extractYtVideoId(url);
  
  if (videoId) {
    console.log(`- YouTube Video detected [ID: ${videoId}]. Attempting metadata and caption extraction...`);
    const meta = await fetchUrlMetadata(url);
    
    let title = meta.title;
    let description = meta.description;
    let channel = 'YouTube Creator';
    
    // Extract metadata from playerResponse block in page HTML
    if (meta.html) {
      try {
        const regex = /ytInitialPlayerResponse\s*=\s*({.+?});/;
        const match = meta.html.match(regex);
        if (match) {
          const playerResponse = JSON.parse(match[1]);
          const details = playerResponse.videoDetails || {};
          title = details.title || title;
          description = details.shortDescription || description;
          channel = details.author || channel;
          console.log(`- YouTube Metadata Resolved. Title: "${title}", Channel: "${channel}"`);
        }
      } catch (e) {
        console.warn(`- Failed to parse ytInitialPlayerResponse: ${e.message}`);
      }
    }

    // Attempt actual transcript track retrieval
    let transcriptText = '';
    let transcriptSuccess = false;
    try {
      console.log(`- Querying transcript from YouTube timedtext tracks...`);
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (transcript && transcript.length > 0) {
        transcriptText = transcript.map(t => t.text).join(' ');
        transcriptSuccess = true;
        console.log(`- YouTube Transcript fetched successfully. Character Count: ${transcriptText.length}`);
      }
    } catch (err) {
      console.warn(`- YouTube Transcript retrieval failed: ${err.message}`);
    }

    if (transcriptSuccess) {
      const fullPayload = `YouTube Video Audit Dossier
Title: ${title}
Channel: ${channel}
Description: ${description}
Transcript / Spoken Content:
${transcriptText}`;
      
      return fullPayload;
    } else {
      console.log(`- Transcript unavailable for video ${videoId}. Checking fallback metadata...`);
      // Strip out default browser page titles (like "YouTube" or empty) to ensure metadata is genuine
      const cleanTitle = title.replace(/-\s*YouTube$/i, '').trim();
      if (!cleanTitle && !description) {
        throw new Error(`YouTube verification failed: No transcript or meaningful metadata exists for this video ID [${videoId}].`);
      }

      const fallbackPayload = `YouTube Video Audit Dossier (Captions Unavailable)
Title: ${cleanTitle}
Channel: ${channel}
Description: ${description}`;
      
      return fallbackPayload;
    }
  } else {
    // Non-YouTube Video (Instagram, Facebook, X etc.)
    console.log(`- Non-YouTube video link detected. Fetching open-graph/meta metadata...`);
    const meta = await fetchUrlMetadata(url);
    
    if (!meta.title && !meta.description) {
      throw new Error(`Video verification failed: No title or metadata could be scraped from this link: ${url}`);
    }

    const payload = `Video Audit Dossier (Open-Graph Scraped)
Title: ${meta.title}
Description: ${meta.description}
Source URL: ${url}`;
    
    return payload;
  }
};

/**
 * Extracts spoken timeline for uploaded local video files (Mock dynamic fallback based on filename)
 */
const transcribeUploadedVideo = async (filename) => {
  console.log(`- Simulating Whisper Speech-to-Text & Keyframe OCR for video file: ${filename}`);
  const lowerName = filename.toLowerCase();

  let subject = "Inspected Video File";
  if (lowerName.includes('covid') || lowerName.includes('corona')) {
    subject = "COVID-19 Health Advisory";
  } else if (lowerName.includes('election') || lowerName.includes('modi') || lowerName.includes('poll')) {
    subject = "Political Campaign / Poll Announcement";
  }

  const mockDossierText = `
    [00:02] Spoken: "Welcome back. Today we are looking at: ${subject}."
    [00:15] Visual: [Graphic text overlays regarding: ${filename}].
    [00:30] Spoken: "We have gathered several clips to analyze the claims made in this footage."
    [00:52] Visual: [Action sequence segment from video].
    [01:10] Spoken: "Verification analysis underway. Please check the courtroom verdict summary."
  `;

  return mockDossierText.trim();
};

/**
 * Main Video Processing Entry
 */
const processVideoInput = async (type, payload) => {
  if (type === 'file') {
    return transcribeUploadedVideo(payload);
  }
  return transcribeVideoUrl(payload);
};

module.exports = {
  processVideoInput,
  transcribeUploadedVideo,
  transcribeVideoUrl
};
