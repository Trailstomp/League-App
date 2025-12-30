"""
YouTube Integration Service
Handles fetching videos, live streams, and playlists from YouTube channels
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import httpx

logger = logging.getLogger(__name__)

class YouTubeService:
    """Service for interacting with YouTube Data API v3"""
    
    BASE_URL = "https://www.googleapis.com/youtube/v3"
    
    def __init__(self, api_key: Optional[str] = None):
        # API key can be passed directly, from env, or will be fetched from DB
        self.api_key = api_key or os.environ.get('YOUTUBE_API_KEY')
        self._cache = {}
        self._cache_ttl = timedelta(minutes=15)
    
    def set_api_key(self, api_key: str):
        """Update the API key (useful when loading from database)"""
        self.api_key = api_key
        logger.info("YouTube API key updated")
    
    def _get_cache_key(self, endpoint: str, params: dict) -> str:
        """Generate cache key from endpoint and params"""
        param_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()) if k != 'key')
        return f"{endpoint}:{param_str}"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self._cache:
            return False
        cached_time = self._cache[cache_key].get('cached_at')
        if not cached_time:
            return False
        return datetime.now() - cached_time < self._cache_ttl
    
    async def _make_request(self, endpoint: str, params: dict) -> dict:
        """Make authenticated request to YouTube API"""
        if not self.api_key:
            logger.warning("YouTube API key not configured")
            return {"error": "YouTube API key not configured", "items": []}
        
        params['key'] = self.api_key
        cache_key = self._get_cache_key(endpoint, params)
        
        # Check cache first
        if self._is_cache_valid(cache_key):
            logger.debug(f"Returning cached data for {endpoint}")
            return self._cache[cache_key]['data']
        
        url = f"{self.BASE_URL}/{endpoint}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    # Cache successful response
                    self._cache[cache_key] = {
                        'data': data,
                        'cached_at': datetime.now()
                    }
                    return data
                elif response.status_code == 403:
                    logger.error("YouTube API quota exceeded or invalid key")
                    return {"error": "API quota exceeded or invalid key", "items": []}
                else:
                    logger.error(f"YouTube API error: {response.status_code} - {response.text}")
                    return {"error": f"API error: {response.status_code}", "items": []}
                    
        except httpx.TimeoutException:
            logger.error("YouTube API request timeout")
            return {"error": "Request timeout", "items": []}
        except Exception as e:
            logger.error(f"YouTube API request failed: {str(e)}")
            return {"error": str(e), "items": []}
    
    async def get_channel_info(self, channel_id: str) -> dict:
        """Get channel information by channel ID"""
        params = {
            'part': 'snippet,statistics,brandingSettings',
            'id': channel_id
        }
        
        result = await self._make_request('channels', params)
        
        if result.get('items'):
            item = result['items'][0]
            return {
                'id': item['id'],
                'title': item['snippet'].get('title', ''),
                'description': item['snippet'].get('description', ''),
                'customUrl': item['snippet'].get('customUrl', ''),
                'thumbnail': item['snippet'].get('thumbnails', {}).get('high', {}).get('url', ''),
                'subscriberCount': item['statistics'].get('subscriberCount', '0'),
                'videoCount': item['statistics'].get('videoCount', '0'),
                'viewCount': item['statistics'].get('viewCount', '0'),
                'bannerImage': item.get('brandingSettings', {}).get('image', {}).get('bannerExternalUrl', '')
            }
        
        return {"error": "Channel not found"}
    
    async def get_channel_videos(self, channel_id: str, max_results: int = 12) -> List[dict]:
        """Get recent videos from a channel"""
        # First, get the uploads playlist ID
        channel_params = {
            'part': 'contentDetails',
            'id': channel_id
        }
        
        channel_result = await self._make_request('channels', channel_params)
        
        if not channel_result.get('items'):
            return []
        
        uploads_playlist_id = channel_result['items'][0].get('contentDetails', {}).get('relatedPlaylists', {}).get('uploads')
        
        if not uploads_playlist_id:
            return []
        
        # Get videos from uploads playlist
        return await self.get_playlist_videos(uploads_playlist_id, max_results)
    
    async def get_playlist_videos(self, playlist_id: str, max_results: int = 12) -> List[dict]:
        """Get videos from a specific playlist"""
        params = {
            'part': 'snippet,contentDetails',
            'playlistId': playlist_id,
            'maxResults': min(max_results, 50)
        }
        
        result = await self._make_request('playlistItems', params)
        
        videos = []
        for item in result.get('items', []):
            snippet = item.get('snippet', {})
            video_id = snippet.get('resourceId', {}).get('videoId', '')
            
            if video_id:
                videos.append({
                    'id': video_id,
                    'videoId': video_id,
                    'title': snippet.get('title', ''),
                    'description': snippet.get('description', '')[:200] + '...' if len(snippet.get('description', '')) > 200 else snippet.get('description', ''),
                    'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url') or 
                                snippet.get('thumbnails', {}).get('medium', {}).get('url') or
                                f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                    'publishedAt': snippet.get('publishedAt', ''),
                    'channelTitle': snippet.get('channelTitle', ''),
                    'playlistId': playlist_id
                })
        
        return videos
    
    async def get_live_streams(self, channel_id: str) -> List[dict]:
        """Get current live streams from a channel"""
        params = {
            'part': 'snippet',
            'channelId': channel_id,
            'eventType': 'live',
            'type': 'video',
            'maxResults': 5
        }
        
        result = await self._make_request('search', params)
        
        live_streams = []
        for item in result.get('items', []):
            video_id = item.get('id', {}).get('videoId', '')
            snippet = item.get('snippet', {})
            
            if video_id:
                live_streams.append({
                    'id': video_id,
                    'videoId': video_id,
                    'title': snippet.get('title', ''),
                    'description': snippet.get('description', ''),
                    'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url') or
                                f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                    'publishedAt': snippet.get('publishedAt', ''),
                    'channelTitle': snippet.get('channelTitle', ''),
                    'isLive': True,
                    'liveBroadcastContent': 'live'
                })
        
        return live_streams
    
    async def get_upcoming_streams(self, channel_id: str) -> List[dict]:
        """Get upcoming scheduled live streams"""
        params = {
            'part': 'snippet',
            'channelId': channel_id,
            'eventType': 'upcoming',
            'type': 'video',
            'maxResults': 5
        }
        
        result = await self._make_request('search', params)
        
        upcoming = []
        for item in result.get('items', []):
            video_id = item.get('id', {}).get('videoId', '')
            snippet = item.get('snippet', {})
            
            if video_id:
                upcoming.append({
                    'id': video_id,
                    'videoId': video_id,
                    'title': snippet.get('title', ''),
                    'description': snippet.get('description', ''),
                    'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url') or
                                f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                    'scheduledStartTime': snippet.get('publishedAt', ''),
                    'channelTitle': snippet.get('channelTitle', ''),
                    'isUpcoming': True,
                    'liveBroadcastContent': 'upcoming'
                })
        
        return upcoming
    
    async def search_videos(self, channel_id: str, query: str, max_results: int = 10) -> List[dict]:
        """Search for videos within a channel"""
        params = {
            'part': 'snippet',
            'channelId': channel_id,
            'q': query,
            'type': 'video',
            'maxResults': min(max_results, 50)
        }
        
        result = await self._make_request('search', params)
        
        videos = []
        for item in result.get('items', []):
            video_id = item.get('id', {}).get('videoId', '')
            snippet = item.get('snippet', {})
            
            if video_id:
                videos.append({
                    'id': video_id,
                    'videoId': video_id,
                    'title': snippet.get('title', ''),
                    'description': snippet.get('description', ''),
                    'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url') or
                                f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                    'publishedAt': snippet.get('publishedAt', ''),
                    'channelTitle': snippet.get('channelTitle', '')
                })
        
        return videos
    
    async def get_video_details(self, video_id: str) -> dict:
        """Get detailed information about a specific video"""
        params = {
            'part': 'snippet,statistics,liveStreamingDetails,contentDetails',
            'id': video_id
        }
        
        result = await self._make_request('videos', params)
        
        if result.get('items'):
            item = result['items'][0]
            snippet = item.get('snippet', {})
            statistics = item.get('statistics', {})
            live_details = item.get('liveStreamingDetails', {})
            content_details = item.get('contentDetails', {})
            
            return {
                'id': video_id,
                'videoId': video_id,
                'title': snippet.get('title', ''),
                'description': snippet.get('description', ''),
                'thumbnail': snippet.get('thumbnails', {}).get('maxres', {}).get('url') or
                            snippet.get('thumbnails', {}).get('high', {}).get('url') or
                            f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
                'publishedAt': snippet.get('publishedAt', ''),
                'channelTitle': snippet.get('channelTitle', ''),
                'channelId': snippet.get('channelId', ''),
                'viewCount': statistics.get('viewCount', '0'),
                'likeCount': statistics.get('likeCount', '0'),
                'commentCount': statistics.get('commentCount', '0'),
                'duration': content_details.get('duration', ''),
                'isLive': live_details.get('actualStartTime') is not None and live_details.get('actualEndTime') is None,
                'liveViewers': live_details.get('concurrentViewers', '0') if live_details else '0',
                'scheduledStartTime': live_details.get('scheduledStartTime', ''),
                'actualStartTime': live_details.get('actualStartTime', '')
            }
        
        return {"error": "Video not found"}
    
    async def get_channel_playlists(self, channel_id: str, max_results: int = 10) -> List[dict]:
        """Get playlists from a channel"""
        params = {
            'part': 'snippet,contentDetails',
            'channelId': channel_id,
            'maxResults': min(max_results, 50)
        }
        
        result = await self._make_request('playlists', params)
        
        playlists = []
        for item in result.get('items', []):
            snippet = item.get('snippet', {})
            content_details = item.get('contentDetails', {})
            
            playlists.append({
                'id': item.get('id', ''),
                'title': snippet.get('title', ''),
                'description': snippet.get('description', ''),
                'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                'itemCount': content_details.get('itemCount', 0),
                'publishedAt': snippet.get('publishedAt', '')
            })
        
        return playlists


# Create singleton instance
youtube_service = YouTubeService()
