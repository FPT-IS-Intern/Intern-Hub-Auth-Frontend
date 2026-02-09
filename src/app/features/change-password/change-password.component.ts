import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Giả định bạn có một service để đổi mật khẩu
// import { AuthService } from '@services/auth.service'; 

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  isSubmitDisabled = computed(() => {
    return !this.newPassword() || !this.confirmPassword() || this.isLoading();
  });


  checkInputRequired(): boolean {
    return this.isSubmitDisabled();
  }

  async handleSubmit() {
    const pass = this.newPassword();
    const confirm = this.confirmPassword();


    this.error.set(null);
    if (pass !== confirm) {
      this.error.set('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (pass.length < 6) {
      this.error.set('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    this.isLoading.set(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Đổi mật khẩu thành công với:', pass);
      
    } catch (err) {
      this.error.set('Đã có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      this.isLoading.set(false);
    }
  }
}