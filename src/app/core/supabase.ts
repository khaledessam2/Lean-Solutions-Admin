import { Injectable, computed, signal } from '@angular/core';
import { SupabaseClient, User, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * The connection to the content database.
 *
 * The key is the anon one, which is safe in a page: row-level security lets it
 * read published content and nothing else until someone signs in, and writing
 * needs a row in `admins` on top of that.
 */

@Injectable({ providedIn: 'root' })
export class Supabase {
  private client: SupabaseClient | null = null;

  readonly user = signal<User | null>(null);
  readonly ready = signal(false);
  /** set when the environment file has not been filled in */
  readonly failure = signal<string | null>(null);

  readonly signedIn = computed(() => this.user() !== null);

  get db(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase was used before connect() finished.');
    }
    return this.client;
  }

  /**
   * Opens the connection and restores an existing session. Runs once, at
   * startup, before the router is allowed to resolve anything.
   */
  async connect(): Promise<void> {
    try {
      const { url: supabaseUrl, anonKey: supabaseAnonKey } = environment.supabase;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'بيانات Supabase ناقصة. املا supabase.url و supabase.anonKey في ' +
            'src/environments/environment.ts.',
        );
      }

      this.client = createClient(supabaseUrl, supabaseAnonKey);

      const { data } = await this.client.auth.getSession();
      this.user.set(data.session?.user ?? null);

      this.client.auth.onAuthStateChange((_event, session) => {
        this.user.set(session?.user ?? null);
      });
    } catch (error) {
      this.failure.set(String((error as Error)?.message ?? error));
    } finally {
      this.ready.set(true);
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error.message));
  }

  async signOut(): Promise<void> {
    await this.db.auth.signOut();
  }

  /**
   * Whether the signed-in user may write. Having an account is not enough — the
   * policies check membership of `admins`, and this asks the same question so
   * the UI can say so plainly instead of failing on save.
   */
  async isAdmin(): Promise<boolean> {
    const id = this.user()?.id;
    if (!id) return false;

    const { data, error } = await this.db.from('admins').select('user_id').eq('user_id', id);
    return !error && (data?.length ?? 0) > 0;
  }

  /** the public URL of a file in the media bucket */
  publicUrl(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;
    return this.db.storage.from('media').getPublicUrl(path).data.publicUrl;
  }
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'لازم تأكد البريد الإلكتروني الأول من لوحة Supabase.';
  }
  return message;
}

