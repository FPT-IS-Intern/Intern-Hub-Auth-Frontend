import { Component, input } from '@angular/core';

@Component({
    selector: 'app-error-message',
    standalone: true,
    templateUrl: './error-message.component.html',
    styleUrl: './error-message.component.scss'
    // Bạn có thể dùng styleUrl nếu có file css riêng
})
export class ErrorMessageComponent {
    // Sử dụng Signal Input (cú pháp hiện đại nhất của Angular)
    message = input.required<string>();
}