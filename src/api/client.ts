export interface VideoFile {
  id: string;
  name: string;
  timestamp: string;
  duration: number;
  url?: string;
  is_favorite?: boolean;
}

export interface SubtitleBlock {
  id: string;
  startTime: number;
  endTime: number;
  originalText: string;
  translatedText: string;
}

const BASE_URL = import.meta.env.DEV ? 'http://localhost:8000' : '';

export async function uploadVideo(file: File): Promise<VideoFile> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Failed to upload video');
  }
  return response.json();
}

export async function getRecentVideos(): Promise<VideoFile[]> {
  const response = await fetch(`${BASE_URL}/api/videos`);
  if (!response.ok) {
    throw new Error('Failed to fetch videos');
  }
  return response.json();
}

export async function getSubtitles(videoId: string, langCode: string): Promise<SubtitleBlock[] | null> {
  const response = await fetch(`${BASE_URL}/api/videos/${videoId}/subtitles?lang=${langCode}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch subtitles');
  }
  const data = await response.json();
  return (data.blocks || []).map((b: any, i: number) => ({
    id: b.id || `s${i + 1}`,
    startTime: b.startTime ?? b.start ?? 0,
    endTime: b.endTime ?? b.end ?? 0,
    originalText: b.originalText || b.original_text || '',
    translatedText: b.translatedText || b.text || ''
  }));
}

export async function translateVideo(videoId: string, targetLang: string): Promise<SubtitleBlock[]> {
  const response = await fetch(`${BASE_URL}/api/videos/${videoId}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target_language: targetLang }),
  });
  if (!response.ok) {
    throw new Error('Failed to translate video');
  }
  const data = await response.json();
  return (data.blocks || []).map((b: any, i: number) => ({
    id: b.id || `s${i + 1}`,
    startTime: b.startTime ?? b.start ?? 0,
    endTime: b.endTime ?? b.end ?? 0,
    originalText: b.originalText || b.original_text || '',
    translatedText: b.translatedText || b.text || ''
  }));
}

export async function deleteVideo(videoId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/videos/${videoId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete video');
}

export async function toggleFavorite(videoId: string, isFavorite: boolean): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/videos/${videoId}/favorite`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_favorite: isFavorite }),
  });
  if (!response.ok) throw new Error('Failed to update favorite');
}

export interface UsageInfo {
  date: string;
  requests_used: number;
  daily_limit: number;
  remaining_requests: number;
  reset_in_hours: number;
}

export async function getUsage(): Promise<UsageInfo> {
  const response = await fetch(`${BASE_URL}/api/usage`);
  if (!response.ok) throw new Error('Failed to fetch usage');
  return await response.json();
}

export interface Revision {
  id: string;
  time: string;
  description: string;
}

export async function saveSubtitles(videoId: string, langCode: string, blocks: SubtitleBlock[]): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/videos/${videoId}/subtitles?lang=${langCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
  if (!response.ok) throw new Error('Failed to save subtitles');
}

export async function getRevisions(videoId: string): Promise<Revision[]> {
  const response = await fetch(`${BASE_URL}/api/videos/${videoId}/revisions`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error('Failed to fetch revisions');
  return await response.json();
}

export async function addRevision(videoId: string, description: string): Promise<Revision> {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const response = await fetch(`${BASE_URL}/api/videos/${videoId}/revisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time, description }),
  });
  if (!response.ok) throw new Error('Failed to add revision');
  return await response.json();
}

