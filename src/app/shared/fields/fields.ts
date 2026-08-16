import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Field } from '../../core/schema';
import { Supabase } from '../../core/supabase';
import { MediaPicker } from '../media-picker/media-picker';

/**
 * Renders a form from a field schema, and edits the value tree in place.
 *
 * It calls itself for groups and list rows, so an arbitrarily deep block —
 * footer columns holding links, hero slides holding paragraphs — needs no
 * bespoke component. The model is mutated directly rather than mirrored into a
 * reactive form: the shapes are irregular enough that a FormGroup would have to
 * be rebuilt on every add and remove, and `changed` is all the parent needs to
 * know that something is unsaved.
 */
@Component({
  selector: 'app-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MediaPicker],
  templateUrl: './fields.html',
  styleUrl: './fields.css',
})
export class Fields {
  readonly fields = input.required<Field[]>();
  readonly model = input.required<Record<string, any>>();
  /** nested instances bubble this up so only the page needs to listen */
  readonly changed = output<void>();

  private readonly supabase = inject(Supabase);

  /** list rows are collapsed by default once there are more than a handful */
  private readonly open = signal<Record<string, boolean>>({});

  // -------------------------------------------------------------------------
  // reading and writing through the model
  // -------------------------------------------------------------------------

  /** a bilingual value, creating it if the block never had this field */
  bilingual(field: Field): { ar: string; en: string } {
    const model = this.model();
    const current = model[field.key];

    if (!current || typeof current !== 'object') {
      model[field.key] = { ar: '', en: '' };
    }
    return model[field.key];
  }

  value(field: Field): any {
    return this.model()[field.key];
  }

  set(field: Field, value: unknown): void {
    this.model()[field.key] = value;
    this.changed.emit();
  }

  setLang(field: Field, lang: 'ar' | 'en', value: string): void {
    this.bilingual(field)[lang] = value;
    this.changed.emit();
  }

  setString(field: Field, value: string): void {
    const trimmed = value.trim();
    // an empty optional string is stored as null so the site sees "not set"
    this.set(field, trimmed === '' && (field as { nullable?: boolean }).nullable ? null : value);
  }

  setNumber(field: Field, value: string): void {
    const parsed = Number(value);
    this.set(field, Number.isFinite(parsed) ? parsed : 0);
  }

  /** the object a group edits, created on demand for optional groups */
  group(field: Field): Record<string, any> {
    const model = this.model();
    if (!model[field.key] || typeof model[field.key] !== 'object') {
      model[field.key] = {};
    }
    return model[field.key];
  }

  // -------------------------------------------------------------------------
  // lists
  // -------------------------------------------------------------------------

  items(field: Field): any[] {
    const model = this.model();
    if (!Array.isArray(model[field.key])) {
      model[field.key] = [];
    }
    return model[field.key];
  }

  add(field: Field): void {
    const list = this.items(field);
    list.push(field.kind === 'textList' ? { ar: '', en: '' } : blank(field));
    this.setOpen(field, list.length - 1, true);
    this.changed.emit();
  }

  removeAt(field: Field, index: number): void {
    this.items(field).splice(index, 1);
    this.changed.emit();
  }

  move(field: Field, index: number, by: number): void {
    const list = this.items(field);
    const to = index + by;
    if (to < 0 || to >= list.length) return;

    [list[index], list[to]] = [list[to], list[index]];
    this.changed.emit();
  }

  /** the line shown on a collapsed row — its title in Arabic, or its position */
  rowTitle(field: Field, row: any, index: number): string {
    const key = (field as { titleKey?: string }).titleKey;
    const value = key ? row?.[key] : undefined;
    const text = typeof value === 'object' ? (value?.ar ?? value?.en) : value;

    return String(text ?? '').trim() || `عنصر ${index + 1}`;
  }

  isOpen(field: Field, index: number): boolean {
    return this.open()[`${field.key}:${index}`] ?? this.items(field).length <= 3;
  }

  toggle(field: Field, index: number): void {
    this.setOpen(field, index, !this.isOpen(field, index));
  }

  private setOpen(field: Field, index: number, value: boolean): void {
    this.open.update((state) => ({ ...state, [`${field.key}:${index}`]: value }));
  }

  // -------------------------------------------------------------------------
  // media
  // -------------------------------------------------------------------------

  preview(path: unknown): string {
    return typeof path === 'string' ? this.supabase.publicUrl(path) : '';
  }

  /** Lottie files have no thumbnail worth showing */
  isImage(path: unknown): boolean {
    return typeof path === 'string' && /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(path);
  }

  bubble(): void {
    this.changed.emit();
  }
}

/** an empty row shaped like the list's schema, so every input has something to bind */
function blank(field: Field): Record<string, any> {
  const row: Record<string, any> = {};

  for (const child of (field as { fields?: Field[] }).fields ?? []) {
    switch (child.kind) {
      case 'text':
        row[child.key] = { ar: '', en: '' };
        break;
      case 'textList':
        row[child.key] = [];
        break;
      case 'list':
        row[child.key] = [];
        break;
      case 'group':
        row[child.key] = blank(child);
        break;
      case 'number':
        row[child.key] = 0;
        break;
      case 'boolean':
        row[child.key] = false;
        break;
      case 'select':
        row[child.key] = child.options[0]?.value ?? '';
        break;
      default:
        row[child.key] = '';
    }
  }

  return row;
}
