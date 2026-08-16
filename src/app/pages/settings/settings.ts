import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Content } from '../../core/content';
import { SETTINGS_FIELDS } from '../../core/schema';
import { Fields } from '../../shared/fields/fields';

/**
 * The identity block. It is small but reaches further than anything else on the
 * site: the footer, the contact card, the JSON-LD organisation node and every
 * canonical URL are built from these twelve values.
 */
@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fields],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private readonly content = inject(Content);

  readonly fields = SETTINGS_FIELDS;
  readonly model = signal<Record<string, any> | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const row = await this.content.settings();
      if (!row) {
        throw new Error(
          'مفيش إعدادات في قاعدة البيانات. شغّل `npm run content:push` في مجلد الموقع الأول.',
        );
      }
      this.model.set(row as unknown as Record<string, any>);
      this.error.set(null);
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.loading.set(false);
    }
  }

  touch(): void {
    this.dirty.set(true);
    this.saved.set(false);
  }

  async save(): Promise<void> {
    const model = this.model();
    if (!model || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);

    try {
      const row = { ...model };
      delete row['id'];
      delete row['updated_at'];

      await this.content.saveSettings(row);
      this.dirty.set(false);
      this.saved.set(true);
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.saving.set(false);
    }
  }
}
