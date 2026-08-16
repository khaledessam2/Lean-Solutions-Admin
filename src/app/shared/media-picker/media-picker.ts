import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { Content } from '../../core/content';

/**
 * The button beside every media field: opens the bucket, lets you pick a file
 * or upload a new one, and hands back the path the site stores — `icons/ai.gif`,
 * not a full URL, because the site resolves paths against its own origin.
 */
@Component({
  selector: 'app-media-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './media-picker.html',
  styleUrl: './media-picker.css',
})
export class MediaPicker {
  readonly picked = output<string>();

  private readonly content = inject(Content);

  readonly open = signal(false);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly files = signal<{ name: string; path: string; url: string }[]>([]);
  readonly query = signal('');
  readonly folder = signal('images');

  readonly folders = ['images', 'icons', 'logo', 'partners', 'lottie'];

  async show(): Promise<void> {
    this.open.set(true);
    if (this.files().length) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      this.files.set(await this.content.listMedia());
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.loading.set(false);
    }
  }

  hide(): void {
    this.open.set(false);
  }

  visible(): { name: string; path: string; url: string }[] {
    const needle = this.query().trim().toLowerCase();
    const all = this.files();
    return needle ? all.filter((f) => f.path.toLowerCase().includes(needle)) : all;
  }

  choose(path: string): void {
    this.picked.emit(path);
    this.hide();
  }

  isImage(path: string): boolean {
    return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(path);
  }

  async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.error.set(null);
    try {
      const path = await this.content.upload(file, this.folder());
      this.files.set(await this.content.listMedia());
      this.choose(path);
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }
}
