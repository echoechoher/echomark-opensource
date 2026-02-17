/**
 * EchoMark API 服务
 */

import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// ============ Auth Token 管理 ============

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ============ 类型定义 ============

export interface Content {
  id: number;
  type: string;
  title: string;
  source_name: string | null;
  source_url: string | null;
  cover_url: string | null;
  description: string | null;
  duration: number | null;
  media_url: string | null;
  transcript_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transcript?: TranscriptSentence[];
  marks_count: number;
  created_at: string;
}

export interface TranscriptSentence {
  start: number;  // 毫秒
  end: number;
  text: string;
}

export interface Mark {
  id: number;
  content_id: number;
  timestamp: number | null;
  context_before: string | null;
  context_current: string | null;
  context_after: string | null;
  thought: string | null;
  source: 'siri' | 'app';
  created_at: string;
  content_title: string | null;
  content_source_name: string | null;
}

// ============ 内容 API ============

export async function importContent(url: string): Promise<Content> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/contents`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '导入失败');
  }
  return response.json();
}

export async function getContents(): Promise<{ items: Content[]; total: number }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/contents`, { headers });
  if (!response.ok) throw new Error('获取内容列表失败');
  return response.json();
}

export async function getContent(id: number): Promise<Content> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/contents/${id}`, { headers });
  if (!response.ok) throw new Error('获取内容详情失败');
  return response.json();
}

export async function getTranscriptStatus(id: number): Promise<{ status: string; task_id: string | null }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/contents/${id}/transcript/status`, { headers });
  if (!response.ok) throw new Error('获取转录状态失败');
  return response.json();
}

export async function deleteContent(id: number): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/contents/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('删除内容失败');
}

export async function cancelTranscription(id: number): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/contents/${id}/cancel-transcription`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) throw new Error('取消转录失败');
}

// ============ 标记 API ============

export async function createMark(contentId: number, timestamp: number): Promise<Mark> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/marks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source: 'app',
      content_id: contentId,
      timestamp: Math.floor(timestamp),
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '创建标记失败');
  }
  return response.json();
}

export async function updateMark(id: number, thought: string): Promise<Mark> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/marks/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ thought }),
  });
  if (!response.ok) throw new Error('更新标记失败');
  return response.json();
}

export async function getMarks(podcast?: string): Promise<{ items: Mark[]; total: number }> {
  const headers = await getAuthHeaders();
  const url = podcast
    ? `${API_BASE}/api/marks?podcast=${encodeURIComponent(podcast)}`
    : `${API_BASE}/api/marks`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('获取标记列表失败');
  return response.json();
}

export async function getMark(id: number): Promise<Mark> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/marks/${id}`, { headers });
  if (!response.ok) throw new Error('获取标记详情失败');
  return response.json();
}

export async function getContentMarks(contentId: number): Promise<{ items: Mark[]; total: number }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/marks/content/${contentId}`, { headers });
  if (!response.ok) throw new Error('获取内容标记失败');
  return response.json();
}

export async function deleteMark(id: number): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/marks/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('删除标记失败');
}

// ============ 播放状态 API ============

export async function updatePlaybackState(contentId: number, currentTime: number): Promise<void> {
  const headers = await getAuthHeaders();
  // 告诉后端当前播放位置，以便 Siri 标记时能获取正确的时间戳和上下文
  await fetch(`${API_BASE}/api/marks/playback-state`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content_id: contentId,
      current_time: Math.floor(currentTime),
    }),
  });
}

export async function getPlaybackState(): Promise<{
  content_id: number | null;
  current_time: number;
  content_title: string | null;
  should_pause: boolean;
  should_resume: boolean;
  resume_from: number;
}> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/marks/playback-state`, {
    headers,
  });
  if (!response.ok) throw new Error('获取播放状态失败');
  return response.json();
}

// ============ 工具函数 ============

export function formatDuration(seconds: number | null): string {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimestamp(seconds: number | null): string {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRecordTime(dateStr: string): string {
  // 后端返回的是 UTC 时间，需要加 Z 后缀让 JS 正确解析
  const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
  const date = new Date(utcDateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  if (diffDays === 0) return `今天 ${timeStr}`;
  if (diffDays === 1) return `昨天 ${timeStr}`;
  if (diffDays < 7) return `${diffDays}天前 ${timeStr}`;

  return `${date.getMonth() + 1}/${date.getDate()} ${timeStr}`;
}

// ============ Siri Shortcut ============

export function getApiBase(): string {
  return API_BASE;
}

// ============ 数据导出 ============

export interface ExportData {
  exportedAt: string;
  contents: Content[];
  marks: Mark[];
}

export async function exportUserData(): Promise<ExportData> {
  // 获取所有内容
  const contentsResult = await getContents();

  // 获取所有标记
  const marksResult = await getMarks();

  return {
    exportedAt: new Date().toISOString(),
    contents: contentsResult.items,
    marks: marksResult.items,
  };
}

export function downloadExportData(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `echomark-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
