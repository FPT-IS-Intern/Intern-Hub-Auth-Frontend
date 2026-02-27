import { Component, input } from '@angular/core';

@Component({
    selector: 'app-error-message',
    standalone: true,
    templateUrl: './error-message.component.html',
    styleUrl: './error-message.component.scss'
})
export class ErrorMessageComponent {
    message = input.required<string>();
}