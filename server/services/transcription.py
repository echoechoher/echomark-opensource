"""
通义听悟转录服务
"""
import os
import time
import httpx
from typing import Optional, List
from dotenv import load_dotenv

from alibabacloud_tingwu20230930.client import Client
from alibabacloud_tingwu20230930 import models as tingwu_models
from alibabacloud_tea_openapi import models as open_api_models

load_dotenv()


class TingwuService:
    """通义听悟转录服务封装"""

    def __init__(self):
        self.access_key_id = os.getenv("TINGWU_ACCESS_KEY_ID")
        self.access_key_secret = os.getenv("TINGWU_ACCESS_KEY_SECRET")
        self.app_key = os.getenv("TINGWU_APP_KEY")

        if not all([self.access_key_id, self.access_key_secret, self.app_key]):
            raise ValueError("通义听悟配置不完整，请检查环境变量")

        config = open_api_models.Config(
            access_key_id=self.access_key_id,
            access_key_secret=self.access_key_secret,
            endpoint='tingwu.cn-beijing.aliyuncs.com'
        )
        self.client = Client(config)

    def create_task(self, audio_url: str) -> str:
        """
        创建转录任务

        Args:
            audio_url: 音频文件 URL

        Returns:
            str: 任务 ID
        """
        input_param = tingwu_models.CreateTaskRequestInput(
            file_url=audio_url,
            source_language='cn',
            task_key=f'task_{int(time.time())}'
        )

        transcription_param = tingwu_models.CreateTaskRequestParametersTranscription(
            diarization_enabled=False,
            output_level=2
        )

        parameters = tingwu_models.CreateTaskRequestParameters(
            transcription=transcription_param
        )

        request = tingwu_models.CreateTaskRequest(
            app_key=self.app_key,
            type='offline',
            input=input_param,
            parameters=parameters
        )

        response = self.client.create_task(request)
        return response.body.data.task_id

    def get_task_status(self, task_id: str) -> dict:
        """
        查询任务状态

        Args:
            task_id: 任务 ID

        Returns:
            dict: {'status': str, 'result_url': str or None}
        """
        response = self.client.get_task_info(task_id)
        data = response.body.data

        result = {
            'status': data.task_status,  # ONGOING, COMPLETED, FAILED
            'result_url': None
        }

        if data.task_status == 'COMPLETED' and data.result:
            result['result_url'] = data.result.transcription

        return result

    async def fetch_and_parse_result(self, result_url: str) -> List[dict]:
        """
        获取并解析转录结果

        Args:
            result_url: 通义听悟返回的结果 JSON URL

        Returns:
            list: 句子列表，每个元素包含 start, end, text（毫秒）
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(result_url)
            data = response.json()

        sentences = []
        paragraphs = data.get('Transcription', {}).get('Paragraphs', [])

        for para in paragraphs:
            words = para.get('Words', [])
            if not words:
                continue

            # 按 SentenceId 分组
            current_sentence_id = None
            current_words = []

            for word in words:
                sentence_id = word.get('SentenceId')

                if sentence_id != current_sentence_id:
                    # 保存上一句
                    if current_words:
                        sentences.append({
                            'start': current_words[0]['Start'],
                            'end': current_words[-1]['End'],
                            'text': ''.join(w['Text'] for w in current_words)
                        })

                    current_sentence_id = sentence_id
                    current_words = []

                current_words.append(word)

            # 保存最后一句
            if current_words:
                sentences.append({
                    'start': current_words[0]['Start'],
                    'end': current_words[-1]['End'],
                    'text': ''.join(w['Text'] for w in current_words)
                })

        return sentences


def get_context_by_timestamp(sentences: list, timestamp_ms: int, context_sentences: int = 2) -> dict:
    """
    根据时间戳获取上下文文稿（按句子数量）

    Args:
        sentences: 句子列表
        timestamp_ms: 标记的时间戳（毫秒）
        context_sentences: 前后各取多少句，默认 2 句

    Returns:
        dict: {
            'before': str,
            'current': str,
            'after': str
        }
    """
    if not sentences:
        return {'before': '', 'current': '', 'after': ''}

    # 找到标记点所在的句子
    current_index = None
    for i, s in enumerate(sentences):
        if s['start'] <= timestamp_ms <= s['end']:
            current_index = i
            break
        if s['start'] > timestamp_ms:
            current_index = i
            break

    if current_index is None:
        current_index = len(sentences) - 1

    # 计算前后句子范围
    start_index = max(0, current_index - context_sentences)
    end_index = min(len(sentences), current_index + context_sentences + 1)

    # 提取文本
    before_texts = [s['text'] for s in sentences[start_index:current_index]]
    current_text = sentences[current_index]['text'] if current_index < len(sentences) else ''
    after_texts = [s['text'] for s in sentences[current_index + 1:end_index]]

    return {
        'before': ''.join(before_texts),
        'current': current_text,
        'after': ''.join(after_texts)
    }


# 单例（延迟初始化，避免没配置时报错）
_tingwu_service = None


def get_tingwu_service() -> TingwuService:
    global _tingwu_service
    if _tingwu_service is None:
        _tingwu_service = TingwuService()
    return _tingwu_service
