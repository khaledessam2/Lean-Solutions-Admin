import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Supabase } from '../../core/supabase';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly supabase = inject(Supabase);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;

    this.busy.set(true);
    this.error.set(null);

    try {
      await this.supabase.signIn(this.email().trim(), this.password());

      if (!(await this.supabase.isAdmin())) {
        await this.supabase.signOut();
        throw new Error(
          'الحساب ده مش مسجل كأدمن. ضيفه في جدول admins — الطريقة مكتوبة في آخر ملف ' +
            'supabase/schema.sql.',
        );
      }

      await this.router.navigate(['/services']);
    } catch (error) {
      this.error.set(String((error as Error).message));
    } finally {
      this.busy.set(false);
    }
  }
}
