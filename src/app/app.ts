import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Supabase } from './core/supabase';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly supabase = inject(Supabase);

  readonly ready = this.supabase.ready;
  readonly failure = this.supabase.failure;
  readonly signedIn = this.supabase.signedIn;
  readonly user = this.supabase.user;

  readonly groups = [
    {
      title: 'المحتوى',
      links: [
        { path: '/services', label: 'الخدمات' },
        { path: '/projects', label: 'المشاريع' },
        { path: '/blocks', label: 'نصوص الموقع' },
      ],
    },
    {
      title: 'الإعدادات',
      links: [
        { path: '/settings', label: 'بيانات الشركة' },
        { path: '/media', label: 'الملفات والصور' },
      ],
    },
  ];

  signOut(): void {
    void this.supabase.signOut();
  }
}
