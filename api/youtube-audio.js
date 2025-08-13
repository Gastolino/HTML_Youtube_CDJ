const youtubedl = require('youtube-dl-exec');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { videoId } = req.query;

  if (!videoId || videoId === 'test') {
    return res.status(400).json({ error: 'Valid Video ID is required' });
  }

  try {
    console.log(`Extracting audio for video: ${videoId}`);
    
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const output = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      format: 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      ]
    });

    if (output && output.url) {
      console.log(`Audio extraction successful for ${videoId}`);
      res.redirect(302, output.url);
    } else {
      throw new Error('No audio stream found');
    }

  } catch (error) {
    console.error('YouTube audio extraction failed:', error.message);
    res.status(500).json({ 
      error: 'Audio extraction failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
