import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';

/** one string in both languages — the site's `Text` */
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

/** every read and write the admin makes, in one place */
@Injectable({ providedIn: 'root' })
export class Content {
  private readonly supabase = inject(Supabase);

  private get db() {
    return this.supabase.db;
  }

  // -------------------------------------------------------------------------
  // content blocks
  // -------------------------------------------------------------------------
  async blocks(): Promise<ContentBlock[]> {
    const { data, error } = await this.db
      .from('content_blocks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as ContentBlock[];
  }

  async block(key: string): Promise<ContentBlock | null> {
    const { data, error } = await this.db
      .from('content_blocks')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as ContentBlock) ?? null;
  }

  async saveBlock(key: string, data: unknown): Promise<void> {
    const { data: rows, error } = await this.db
      .from('content_blocks')
      .update({ data })
      .eq('key', key)
      .select('key');

    if (error) throw new Error(describe(error.message));
    // `.select()` is what makes a refused write visible: row-level security
    // hides the row from the update instead of raising, so without it Supabase
    // reports success on nothing at all
    if (!rows?.length) throw new Error(DENIED);
  }

  // -------------------------------------------------------------------------
  // services and projects
  // -------------------------------------------------------------------------
  async services(): Promise<ServiceRow[]> {
    const { data, error } = await this.db
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as ServiceRow[];
  }

  async service(id: string): Promise<ServiceRow | null> {
    const { data, error } = await this.db.from('services').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ServiceRow) ?? null;
  }

  async projects(): Promise<ProjectRow[]> {
    const { data, error } = await this.db
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as ProjectRow[];
  }

  async project(id: string): Promise<ProjectRow | null> {
    const { data, error } = await this.db.from('projects').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ProjectRow) ?? null;
  }

  async save(table: 'services' | 'projects', row: Record<string, unknown>): Promise<string> {
    const { data, error } = row['id']
      ? await this.db.from(table).update(row).eq('id', row['id']).select('id').single()
      : await this.db.from(table).insert(row).select('id').single();

    if (error) throw new Error(describe(error.message));
    return (data as { id: string }).id;
  }

  async remove(table: 'services' | 'projects', id: string): Promise<void> {
    const { data, error } = await this.db.from(table).delete().eq('id', id).select('id');
    if (error) throw new Error(describe(error.message));
    if (!data?.length) throw new Error(DENIED);
  }

  /** persists a new order after a drag, as one call per moved row */
  async reorder(table: 'services' | 'projects', ids: string[]): Promise<void> {
    const updates = ids.map((id, index) =>
      this.db.from(table).update({ sort_order: index }).eq('id', id).select('id'),
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(describe(failed.error.message));
    if (results.some((r) => !r.data?.length)) throw new Error(DENIED);
  }

  /** the next free sort_order, so a new row lands at the end of the list */
  async nextOrder(table: 'services' | 'projects'): Promise<number> {
    const { data } = await this.db
      .from(table)
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    return ((data?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1;
  }

  // -------------------------------------------------------------------------
  // site settings
  // -------------------------------------------------------------------------
  async settings(): Promise<SettingsRow | null> {
    const { data, error } = await this.db.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as SettingsRow) ?? null;
  }

  async saveSettings(row: Record<string, unknown>): Promise<void> {
    const { data, error } = await this.db
      .from('site_settings')
      .update(row)
      .eq('id', 1)
      .select('id');

    if (error) throw new Error(describe(error.message));
    if (!data?.length) throw new Error(DENIED);
  }

  // -------------------------------------------------------------------------
  // media
  // -------------------------------------------------------------------------
  async listMedia(prefix = ''): Promise<{ name: string; path: string; url: string }[]> {
    const { data, error } = await this.db.storage
      .from('media')
      .list(prefix, { limit: 200, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw new Error(error.message);

    const folders = (data ?? []).filter((f) => f.id === null);
    const files = (data ?? []).filter((f) => f.id !== null);

    // one level of recursion is enough: the site's assets sit in flat folders
    const nested = await Promise.all(
      prefix ? [] : folders.map((folder) => this.listMedia(folder.name)),
    );

    return [
      ...files.map((file) => {
        const path = prefix ? `${prefix}/${file.name}` : file.name;
        return { name: file.name, path, url: this.supabase.publicUrl(path) };
      }),
      ...nested.flat(),
    ];
  }

  async upload(file: File, folder: string): Promise<string> {
    const safe = file.name.replace(/[^\w.\-]+/g, '-').toLowerCase();
    const path = folder ? `${folder}/${safe}` : safe;

    const { error } = await this.db.storage
      .from('media')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (error) throw new Error(describe(error.message));
    return path;
  }
}

/**
 * What a write that touched no rows means in practice. Row-level security does
 * not raise on an update or a delete it refuses — it just hides the row — so
 * this is the message for a call that came back clean but changed nothing.
 */
const DENIED =
  'الحفظ محصلش — محتاج صلاحية أدمن. ضيف حسابك في جدول admins — الطريقة مكتوبة في آخر ' +
  'ملف supabase/schema.sql.';

/** turn the failures that actually happen into something actionable */
function describe(message: string): string {
  if (/row-level security|violates row-level/i.test(message)) {
    return (
      'محتاج صلاحية أدمن عشان تحفظ. ضيف حسابك في جدول admins — الطريقة مكتوبة في آخر ' +
      'ملف supabase/schema.sql.'
    );
  }
  if (/duplicate key|unique constraint/i.test(message)) {
    return 'المعرّف ده مستخدم قبل كده. اختار معرّف تاني.';
  }
  // PGRST116: `.single()` got no row back — the same refusal as DENIED, seen
  // through the insert/update path that does ask for the row
  if (/PGRST116|multiple \(or no\) rows|0 rows/i.test(message)) {
    return DENIED;
  }
  return message;
}
