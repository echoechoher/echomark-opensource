"""
小宇宙链接解析服务
"""
import re
import json
import httpx
from typing import Optional


class XiaoyuzhouParser:
    """小宇宙播客链接解析"""

    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }

    MEDIA_BASE_URL = 'https://media.xyzcdn.net/'

    @staticmethod
    def is_xiaoyuzhou_url(url: str) -> bool:
        """判断是否是小宇宙链接"""
        return 'xiaoyuzhoufm.com' in url

    async def parse(self, url: str) -> dict:
        """
        解析小宇宙单集链接，提取播客信息

        Args:
            url: 小宇宙单集链接，如 https://www.xiaoyuzhoufm.com/episode/xxx

        Returns:
            dict: 包含 podcast_name, title, audio_url, cover_url, duration, description

        Raises:
            ValueError: 解析失败
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.HEADERS, follow_redirects=True)
            response.raise_for_status()
            html = response.text

        # __NEXT_DATA__ 包含最完整的数据，优先使用
        next_pattern = r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>'
        next_match = re.search(next_pattern, html, re.DOTALL)

        if next_match:
            return self._parse_next_data(next_match.group(1))

        # 备用：尝试 JSON-LD (可能有 name 属性)
        pattern = r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>'
        match = re.search(pattern, html, re.DOTALL)

        if match:
            return self._parse_json_ld(match.group(1))

        raise ValueError("无法找到可解析的数据")

    def _parse_json_ld(self, json_str: str) -> dict:
        """解析 JSON-LD 格式数据"""
        data = json.loads(json_str)
        return {
            'podcast_name': data.get('partOfSeries', {}).get('name', ''),
            'title': data.get('name', ''),
            'audio_url': data.get('audio', {}).get('contentUrl', ''),
            'cover_url': data.get('image', ''),
            'duration': data.get('duration', 0),
            'description': data.get('description', ''),
        }

    def _parse_next_data(self, json_str: str) -> dict:
        """解析 Next.js SSR 数据"""
        data = json.loads(json_str)
        props = data.get('props', {}).get('pageProps', {})
        episode = props.get('episode', {})
        podcast = episode.get('podcast', {})

        # 构建音频 URL
        media_key = episode.get('mediaKey', '')
        audio_url = f"{self.MEDIA_BASE_URL}{media_key}" if media_key else ''

        # 获取封面 URL
        cover_url = ''
        if podcast.get('image', {}).get('picUrl'):
            cover_url = podcast['image']['picUrl']
        elif episode.get('image', {}).get('picUrl'):
            cover_url = episode['image']['picUrl']

        return {
            'podcast_name': podcast.get('title', ''),
            'title': episode.get('title', ''),
            'audio_url': audio_url,
            'cover_url': cover_url,
            'duration': episode.get('duration', 0),
            'description': episode.get('description', ''),
        }


# 单例
xiaoyuzhou_parser = XiaoyuzhouParser()
