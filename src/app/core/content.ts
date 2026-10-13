export interface Bilingual {
  ar: string;
  en: string;
}

export interface ContentBlock {
  key: string;
  label: string;
  section: string;
  sort_order: number;
  data: Record<string, unknown>;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  slug: string;
  sort_order: number;
  icon: string;
  category: string;
  title: Bilingual;
  body: Bilingual;
  has_detail: boolean;
  external_url: string | null;
  detail: Record<string, unknown> | null;
  published: boolean;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  slug: string;
  sort_order: number;
  image: string;
  category: string;
  tag: Bilingual;
  title: Bilingual;
  body: Bilingual;
  detail: Record<string, unknown> | null;
  published: boolean;
  updated_at: string;
}

export interface SettingsRow {
  id: number;
  origin: string;
  name: Bilingual;
  legal_name: string;
  logo: string;
  og_image: string;
  service_cover: string;
  phone: string;
  email: string;
  city: Bilingual;
  country: Bilingual;
  linkedin: string;
  map_embed: string;
  updated_at: string;
}
