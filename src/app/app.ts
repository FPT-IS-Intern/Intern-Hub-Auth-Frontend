import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DynamicDsService } from 'dynamic-ds';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('auth-service-fe');
  private readonly themeService = inject(DynamicDsService);

  ngOnInit(): void {
    this.themeService.initializeTheme().subscribe();
  }
}
