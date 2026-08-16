import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Content, ProjectRow, ServiceRow } from '../../core/content';
import { Supabase } from '../../core/supabase';

type Row = (ServiceRow | ProjectRow) & { icon?: string; image?: string };
type Table = 'services' | 'projects';

/**
 * The listing behind both /services and /projects — the two differ only in
 * which column carries the thumbnail, so one component serves both and takes
 * the table from the route's data.
 */
@Component({
  selector: 'app-catalog-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './catalog-list.html',
  styleUrl: './catalog.css',
})
export class CatalogList implements OnInit {
  /** bound from the route's `data`, via withComponentInputBinding() */
  readonly table = input.required<Table>();

  private readonly content = inject(Content);
  private readonly supabase = inject(Supabase);
  private readonly router = inject(Router);

  readonly rows = signal<Row[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal<string>('all');
  readonly query = signal('');

  readonly isServices = computed(() => this.table() === 'services');
  readonly heading = computed(() => (this.isServices() ? 'الخدمات' : 'المشاريع'));

  readonly categories = [
    { key: 'all', label: 'الكل' },
    { key: 'elearning', label: 'التعليم الإلكتروني' },
    { key: 'digital', label: 'التحول الرقمي' },
    { key: 'management', label: 'الاستشارات الإدارية' },
  ];

  readonly visible = computed(() => {
    const category = this.filter();
    const needle = this.query().trim().toLowerCase();

    return this.rows().filter((row) => {
      if (category !== 'all' && row.category !== category) return false;
      if (!needle) return true;

      return (
        row.slug.toLowerCase().includes(needle) ||
        row.title.ar.toLowerCase().includes(needle) ||
        row.title.en.toLowerCase().includes(needle)
      );
    });
  });

  // not the constructor: a required input has no value until Angular sets it
  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const rows =
        this.table() === 'services' ? await this.content.services() : await this.content.projects();
      this.rows.set(rows as Row[]);
      this.error.set(null);
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.loading.set(false);
    }
  }

  thumb(row: Row): string {
    return this.supabase.publicUrl(this.isServices() ? (row.icon ?? '') : (row.image ?? ''));
  }

  categoryLabel(key: string): string {
    return this.categories.find((c) => c.key === key)?.label ?? key;
  }

  /**
   * Moving a row rewrites `sort_order` for the whole list, so the numbers stay
   * contiguous however many times things are shuffled.
   */
  async move(row: Row, by: number): Promise<void> {
    const all = [...this.rows()];
    const from = all.findIndex((r) => r.id === row.id);
    const to = from + by;
    if (to < 0 || to >= all.length) return;

    [all[from], all[to]] = [all[to], all[from]];
    this.rows.set(all);

    try {
      await this.content.reorder(this.table(), all.map((r) => r.id));
    } catch (error) {
      this.error.set(String((error as Error).message));
      void this.load();
    }
  }

  async create(): Promise<void> {
    await this.router.navigate([this.table(), 'new']);
  }

  async remove(row: Row, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm(`تحذف "${row.title.ar}" نهائيًا؟`)) return;

    try {
      await this.content.remove(this.table(), row.id);
      this.rows.update((rows) => rows.filter((r) => r.id !== row.id));
    } catch (error) {
      this.error.set(String((error as Error).message));
    }
  }
}
