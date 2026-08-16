import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Content } from '../../core/content';
import { BLOCK_SCHEMAS } from '../../core/schema';
import { Fields } from '../../shared/fields/fields';

/** Edits one `content_blocks` row through the schema that describes its shape. */
@Component({
  selector: 'app-block-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fields, RouterLink],
  templateUrl: './block-edit.html',
  styleUrl: './blocks.css',
})
export class BlockEdit implements OnInit {
  readonly key = input.required<string>();

  private readonly content = inject(Content);

  readonly model = signal<Record<string, any> | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  readonly schema = computed(() => BLOCK_SCHEMAS.find((s) => s.key === this.key()));

  // not the constructor: a required input has no value until Angular sets it
  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      if (!this.schema()) {
        throw new Error(`مفيش قسم بالمعرّف "${this.key()}".`);
      }

      const block = await this.content.block(this.key());
      if (!block) {
        throw new Error(
          `القسم ده مش موجود في قاعدة البيانات. شغّل \`npm run content:push\` في مجلد الموقع ` +
            `عشان تتزرع النصوص الحالية.`,
        );
      }

      this.model.set(block.data ?? {});
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
      await this.content.saveBlock(this.key(), model);
      this.dirty.set(false);
      this.saved.set(true);
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.saving.set(false);
    }
  }
}
