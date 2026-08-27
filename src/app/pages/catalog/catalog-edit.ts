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
import { Content } from '../../core/content';
import {
  PROJECT_DETAIL_FIELDS,
  PROJECT_FIELDS,
  SERVICE_DETAIL_FIELDS,
  SERVICE_FIELDS,
} from '../../core/schema';
import { Fields } from '../../shared/fields/fields';

type Table = 'services' | 'projects';

/**
 * The editor for one service or project: the card at the top, its detail page
 * below. Both are the same screen because on the site they are one thing — a
 * card whose button opens its own page — and editing them apart invites the
 * two to drift.
 */
@Component({
  selector: 'app-catalog-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fields, RouterLink],
  templateUrl: './catalog-edit.html',
  styleUrl: './catalog.css',
})
export class CatalogEdit implements OnInit {
  readonly table = input.required<Table>();
  readonly id = input.required<string>();

  private readonly content = inject(Content);
  private readonly router = inject(Router);

  readonly model = signal<Record<string, any> | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  readonly isNew = computed(() => this.id() === 'new');
  readonly isServices = computed(() => this.table() === 'services');

  readonly cardFields = computed(() => (this.isServices() ? SERVICE_FIELDS : PROJECT_FIELDS));
  readonly detailFields = computed(() =>
    this.isServices() ? SERVICE_DETAIL_FIELDS : PROJECT_DETAIL_FIELDS,
  );

  readonly backLink = computed(() => `/${this.table()}`);
  readonly heading = computed(() => {
    if (this.isNew()) return this.isServices() ? 'خدمة جديدة' : 'مشروع جديد';
    return this.model()?.['title']?.ar || 'تعديل';
  });

  /** the detail object, which the form edits directly */
  readonly detail = computed<Record<string, any>>(() => {
    const model = this.model();
    if (!model) return {};
    if (!model['detail'] || typeof model['detail'] !== 'object') {
      model['detail'] = {};
    }
    return model['detail'];
  });

  // not the constructor: a required input has no value until Angular sets it
  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      if (this.isNew()) {
        this.model.set(await this.blank());
      } else {
        const row =
          this.table() === 'services'
            ? await this.content.service(this.id())
            : await this.content.project(this.id());

        if (!row) throw new Error('العنصر ده مش موجود.');
        this.model.set(row as unknown as Record<string, any>);
      }
      this.error.set(null);
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.loading.set(false);
    }
  }

  private async blank(): Promise<Record<string, any>> {
    const shared = {
      slug: '',
      sort_order: await this.content.nextOrder(this.table()),
      category: 'elearning',
      title: { ar: '', en: '' },
      body: { ar: '', en: '' },
      published: true,
      detail: {},
    };

    return this.isServices()
      ? { ...shared, icon: '', has_detail: true, external_url: null }
      : { ...shared, image: '', tag: { ar: '', en: '' } };
  }

  touch(): void {
    this.dirty.set(true);
    this.saved.set(false);
  }

  async save(): Promise<void> {
    const model = this.model();
    if (!model || this.saving()) return;

    if (!String(model['slug'] ?? '').trim()) {
      this.error.set('لازم تحط معرّف للرابط (slug) الأول.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      // an empty detail object would prerender a blank page — store nothing instead
      const detail = model['detail'];
      const row: Record<string, unknown> = {
        ...model,
        detail: detail && Object.keys(detail).length ? detail : null,
      };
      // written by a trigger, and rejected on insert
      delete row['updated_at'];

      const id = await this.content.save(this.table(), row);

      // /new and /:id are the same route, so the router keeps this component
      // alive and never re-runs load() — the new row's id has to land in the
      // model here, or the next save inserts a second copy instead of updating
      const wasNew = this.isNew();
      model['id'] = id;
      this.model.set({ ...model });

      this.dirty.set(false);
      this.saved.set(true);

      if (wasNew) {
        await this.router.navigate([this.table(), id]);
      }
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.saving.set(false);
    }
  }
}
