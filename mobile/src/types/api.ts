export type Role = 'viewer' | 'editor' | 'admin';

export type GalleryImage = {
  id: string;
  imageUrl: string;
  caption: string | null;
  senderName: string | null;
  status: 'published' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
};

export type GalleryNote = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Page<T> = { items: T[]; nextCursor: string | null };

export type Me = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: Role;
};
