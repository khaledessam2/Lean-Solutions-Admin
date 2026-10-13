export type Field =
  /** one string in both languages — `{ar, en}`, the site's `Text` */
  | { kind: 'text'; key: string; label: string; rows?: number; hint?: string }
  /** a plain single-language string: a path, a URL, a slug */
  | { kind: 'string'; key: string; label: string; hint?: string; nullable?: boolean }
  | { kind: 'number'; key: string; label: string; hint?: string }
  | { kind: 'boolean'; key: string; label: string; hint?: string }
  /** a path into the media bucket, with a picker and a preview */
  | { kind: 'media'; key: string; label: string; hint?: string }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  /** a repeatable list of bilingual strings — bullet points, paragraphs */
  | { kind: 'textList'; key: string; label: string; rows?: number; hint?: string }
  /** a fixed nested object */
  | { kind: 'group'; key: string; label: string; fields: Field[] }
  /** a repeatable list of objects; `title` names each row in the collapsed view */
  | {
    kind: 'list';
    key: string;
    label: string;
    fields: Field[];
    titleKey?: string;
    addLabel?: string;
  };

export interface BlockSchema {
  key: string;
  label: string;
  /** shown under the heading, to say where on the site this appears */
  where: string;
  fields: Field[];
}
