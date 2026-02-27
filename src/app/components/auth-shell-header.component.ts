import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-shell-header.component.html',
  styleUrls: ['./auth-shell-header.component.scss'],
})
export class AuthShellHeaderComponent {}
