import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthShellHeaderComponent } from '../components/auth-shell-header.component';
import { AuthShellFooterComponent } from '../components/auth-shell-footer.component';

@Component({
  selector: 'app-auth-shell-layout',
  standalone: true,
  imports: [RouterOutlet, AuthShellHeaderComponent, AuthShellFooterComponent],
  templateUrl: './auth-shell-layout.component.html',
  styleUrls: ['./auth-shell-layout.component.scss'],
})
export class AuthShellLayoutComponent {}
