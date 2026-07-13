import { apiRequest } from './client';
import type { GalleryImage, GalleryNote, Me, Page } from '@/src/types/api';

const pageQuery = (cursor?: string | null) => (cursor ? `?cursor=${encodeURIComponent(cursor)}` : '');

export const getMe = () => apiRequest<Me>('/api/v1/me');
export const getGallery = (cursor?: string | null) => apiRequest<Page<GalleryImage>>(`/api/v1/gallery${pageQuery(cursor)}`);
export const getGalleryImage = (id: string) => apiRequest<{ item: GalleryImage }>(`/api/v1/gallery/${id}`);
export const getNotes = (cursor?: string | null) => apiRequest<Page<GalleryNote>>(`/api/v1/notes${pageQuery(cursor)}`);
export const getAdminImages = (cursor?: string | null) => apiRequest<Page<GalleryImage>>(`/api/v1/admin/images${pageQuery(cursor)}`);
export const getAdminImage = (id: string) => apiRequest<{ item: GalleryImage }>(`/api/v1/admin/images/${id}`);
export const updateImage = (id: string, changes: Pick<GalleryImage, 'caption' | 'status'>) =>
  apiRequest<{ item: GalleryImage }>(`/api/v1/admin/images/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
export const deleteImage = (id: string) => apiRequest<{ ok: true }>(`/api/v1/admin/images/${id}`, { method: 'DELETE' });
export const createNote = (content: string) =>
  apiRequest<{ item: GalleryNote }>('/api/v1/admin/notes', { method: 'POST', body: JSON.stringify({ content }) });
export const updateNote = (id: string, content: string) =>
  apiRequest<{ item: GalleryNote }>(`/api/v1/admin/notes/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) });
export const deleteNote = (id: string) => apiRequest<{ ok: true }>(`/api/v1/admin/notes/${id}`, { method: 'DELETE' });
