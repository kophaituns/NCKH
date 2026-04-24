import logging
try:
    from trafilatura import fetch_url, extract
except ImportError:
    fetch_url, extract = None, None

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    import re
except ImportError:
    YouTubeTranscriptApi, re = None, None

logger = logging.getLogger(__name__)

class ContentExtractor:
    @staticmethod
    def extract_from_url(url: str) -> str:
        if not fetch_url:
            raise Exception("trafilatura not installed")
        
        downloaded = fetch_url(url)
        if not downloaded:
            raise Exception("Failed to fetch URL content")
            
        text = extract(downloaded, include_comments=False, include_tables=False)
        if not text:
            raise Exception("Failed to extract readable text from URL")
            
        return text

    @staticmethod
    def extract_from_youtube(url: str) -> str:
        if not YouTubeTranscriptApi:
            raise Exception("youtube-transcript-api not installed")
            
        # Extract video ID
        video_id = None
        # standard youtube url
        match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
        if match:
            video_id = match.group(1)
            
        if not video_id:
            raise Exception("Invalid YouTube URL")
            
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'vi'])
            text = " ".join([t['text'] for t in transcript])
            return text
        except Exception as e:
            logger.error(f"Failed to get transcript: {e}")
            raise Exception(f"Failed to get YouTube transcript: {e}")

content_extractor = ContentExtractor()
