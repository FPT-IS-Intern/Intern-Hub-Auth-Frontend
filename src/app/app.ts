import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginFormComponent } from './features/login/login-form.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginFormComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('auth-service-fe');
}
