// api/youtube-audio.js
const youtubedl = require('youtube-dl-exec');

export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('API called with method:', req.method);
  console.log('Query params:', req.query);

  const { videoId } = req.query;

  // Handle test endpoint for server status check
  if (!videoId || videoId === 'test') {
    return res.status(400).json({ 
      error: 'Valid Video ID is required',
      message: 'API is working - provide a valid YouTube video ID'
    });
  }

  try {
    console.log(`Processing video ID: ${videoId}`);
    
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Extract audio stream URL using youtube-dl-exec
    const output = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      format: 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    });

    if (output && output.url) {
      console.log(`Audio extraction successful for ${videoId}`);
      console.log(`Redirecting to: ${output.url.substring(0, 100)}...`);
      
      // Set additional headers for audio streaming
      res.setHeader('Content-Type', 'audio/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Redirect to the audio stream
      res.redirect(302, output.url);
    } else {
      throw new Error('No audio stream found in YouTube response');
    }

  } catch (error) {
    console.error('YouTube audio extraction failed:', error);
    
    // More detailed error response
    res.status(500).json({ 
      error: 'Audio extraction failed',
      message: error.message,
      videoId: videoId,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error.stack : 'Check server logs for details'
    });
  }
}
