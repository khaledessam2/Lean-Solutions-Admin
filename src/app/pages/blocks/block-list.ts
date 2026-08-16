import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Content } from '../../core/content';
import { BLOCK_SCHEMAS } from '../../core/schema';

/**
 * Every fixed piece of copy on the site, grouped the way the site is laid out:
 * the shell you see on every page, the home page's sections, then the inner
 * pages.
 */
@Component({
  selector: 'app-block-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './block-list.html',
  styleUrl: './blocks.css',
})
export class BlockList {
  private readonly content = inject(Content);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  /** the keys the database actually holds, so a missing block is visible */
  readonly present = signal<Set<string>>(new Set());

  readonly groups = [
    { section: 'shell', title: 'الهيدر والفوتر', keys: ['header', 'footer', 'common'] },
    {
      section: 'home',
      title: 'الصفحة الرئيسية',
      keys: ['hero', 'about', 'pillars', 'services', 'projects', 'clients', 'contact', 'home'],
    },
    {
      section: 'pages',
      title: 'الصفحات الداخلية',
      keys: ['page.about', 'page.services', 'page.projects', 'page.contact', 'page.detail'],
    },
  ];

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const blocks = await this.content.blocks();
      this.present.set(new Set(blocks.map((b) => b.key)));
      this.error.set(null);
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.loading.set(false);
    }
  }

  schema(key: string) {
    return BLOCK_SCHEMAS.find((s) => s.key === key);
  }

  missing(key: string): boolean {
    return !this.loading() && !this.present().has(key);
  }
}
