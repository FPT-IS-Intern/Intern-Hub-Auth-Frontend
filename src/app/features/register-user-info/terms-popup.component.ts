import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-terms-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-popup.component.html',
  styleUrls: ['./terms-popup.component.scss'],
})
export class TermsPopupComponent {
  @Output() closePopup = new EventEmitter<void>();
  @Output() acceptTerms = new EventEmitter<void>();

  onAccept(): void {
    this.acceptTerms.emit();
  }

  onClose(): void {
    this.closePopup.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('terms-popup-overlay')) {
      this.onClose();
    }
  }
}
