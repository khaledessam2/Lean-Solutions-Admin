import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Content } from '../../core/content';

/**
 * The media bucket, browsable on its own.
 *
 * The site's own `public/` folder is still the fastest place for assets that
 * never change; this is for everything added after launch, and for seeing what
 * a path in a content field actually points at.
 */
@Component({
  selector: 'app-media',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './media.html',
  styleUrl: './media.css',
})
export class Media {
  private readonly content = inject(Content);

  readonly files = signal<{ name: string; path: string; url: string }[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly copied = signal<string | null>(null);
  readonly query = signal('');
  readonly folder = signal('images');

  readonly folders = ['images', 'icons', 'logo', 'partners', 'lottie'];

  readonly visible = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const all = this.files();
    return needle ? all.filter((f) => f.path.toLowerCase().includes(needle)) : all;
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.files.set(await this.content.listMedia());
      this.error.set(null);
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.loading.set(false);
    }
  }

  isImage(path: string): boolean {
    return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(path);
  }

  async copy(path: string): Promise<void> {
    await navigator.clipboard.writeText(path);
    this.copied.set(path);
    setTimeout(() => this.copied.set(null), 1600);
  }

  async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    this.uploading.set(true);
    this.error.set(null);
    try {
      for (const file of files) {
        await this.content.upload(file, this.folder());
      }
      await this.load();
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }
}
