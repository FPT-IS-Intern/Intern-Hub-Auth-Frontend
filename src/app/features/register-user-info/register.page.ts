import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AvatarUploadButtonComponent,
  AvatarUploadedFile,
  ButtonContainerComponent,
  DatePickerComponent,
  InputTextComponent,
} from '@goat-bravos/intern-hub-layout';
import { ProcessStep, ProcessStepComponent } from './process-step.component';
import { TermsPopupComponent } from './terms-popup.component';
import { RegisterUserService } from '../../services/register-user.service';
import { RegisterUserRequest } from '../../models/register.model';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [
    CommonModule,
    FormsModule,
    InputTextComponent,
    ButtonContainerComponent,
    DatePickerComponent,
    AvatarUploadButtonComponent,
    ProcessStepComponent,
    TermsPopupComponent,
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  private readonly registerUserService = inject(RegisterUserService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  steps: ProcessStep[] = [
    { stepNumber: 1, label: 'Thông tin cá nhân' },
    { stepNumber: 2, label: 'Xem lại thông tin' },
    { stepNumber: 3, label: 'Hoàn thành' },
  ];
  currentStep = 1;

  email = '';
  fullName = '';
  idNumber = '';
  birthDate: Date | null = null;
  address = '';
  phoneNumber = '';
  positionCode = '';
  internshipStartDate: Date | null = null;
  internshipEndDate: Date | null = null;

  avatarFile: File | null = null;
  cvFile: File | null = null;
  avatarPreviewUrl: string | null = null;
  cvFileName = '';

  agreeTerms = false;
  showTermsPopup = false;
  errors: Record<string, string> = {};
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  isInternPosition(): boolean {
    return this.positionCode.toLowerCase().includes('intern');
  }

  onAvatarChange(file: AvatarUploadedFile | null): void {
    this.avatarFile = file?.file || null;
    this.avatarPreviewUrl = file?.previewUrl || null;
    if (this.avatarFile) {
      delete this.errors['avatar'];
    }
  }

  onCvChange(file: AvatarUploadedFile | null): void {
    this.cvFile = file?.file || null;
    this.cvFileName = file?.fileName || '';
    if (this.cvFile) {
      delete this.errors['cv'];
    }
  }

  onTermsChange(): void {
    if (this.agreeTerms) {
      delete this.errors['agreeTerms'];
    }
  }

  openTermsPopup(event: Event): void {
    event.preventDefault();
    this.showTermsPopup = true;
  }

  onTermsAccepted(): void {
    this.showTermsPopup = false;
  }

  onPositionInput(value: string): void {
    this.positionCode = value.replace(/[^a-zA-ZÀ-ỹ\s]/g, '');
  }

  onBirthDateChange(date: Date | null): void {
    this.birthDate = date;
    if (date) {
      delete this.errors['birthDate'];
    }
  }

  onInternshipStartDateChange(date: Date | null): void {
    this.internshipStartDate = date;
    if (date) {
      delete this.errors['internshipStartDate'];
    }
  }

  onInternshipEndDateChange(date: Date | null): void {
    this.internshipEndDate = date;
    if (date) {
      delete this.errors['internshipEndDate'];
    }
  }

  formatDateToDisplayStr(date: Date | null): string {
    if (!date) {
      return '-';
    }

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  goToStep2(): void {
    if (!this.validateForm()) {
      return;
    }

    this.currentStep = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBackToStep1(): void {
    this.currentStep = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  confirmAndSubmit(): void {
    if (this.isLoading) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    if (!this.avatarFile || !this.cvFile) {
      this.errorMessage = 'Vui lòng tải lên ảnh đại diện và CV trước khi đăng ký.';
      return;
    }

    const payload: RegisterUserRequest = {
      email: this.email,
      fullName: this.fullName,
      idNumber: this.idNumber,
      birthDate: this.formatDateToBackendStr(this.birthDate),
      address: this.address,
      phoneNumber: this.phoneNumber,
      positionCode: this.positionCode,
      internshipStartDate: this.isInternPosition()
        ? this.formatDateToBackendStr(this.internshipStartDate)
        : undefined,
      internshipEndDate: this.isInternPosition()
        ? this.formatDateToBackendStr(this.internshipEndDate)
        : undefined,
    };

    this.isLoading = true;

    this.registerUserService.registerUser(payload, this.avatarFile, this.cvFile).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Đăng ký thành công! Vui lòng chờ admin phê duyệt.';
        this.currentStep = 3;
        this.changeDetectorRef.detectChanges();
      },
      error: (error: Error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  goBackToLogin(): void {
    void this.router.navigateByUrl('/auth');
  }

  private formatDateToBackendStr(date: Date | null): string {
    if (!date) {
      return '';
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private validateForm(): boolean {
    this.errors = {};
    this.validatePersonalInfo();
    this.validateFiles();
    this.validateInternship();

    if (!this.agreeTerms) {
      this.errors['agreeTerms'] = 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    return Object.keys(this.errors).length === 0;
  }

  private validatePersonalInfo(): void {
    if (!this.email.trim()) {
      this.errors['email'] = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.errors['email'] = 'Email không đúng định dạng';
    }

    if (!this.fullName.trim()) {
      this.errors['fullName'] = 'Họ tên không được để trống';
    } else if (this.fullName.length > 100) {
      this.errors['fullName'] = 'Họ tên không được quá 100 ký tự';
    }

    if (!this.idNumber.trim()) {
      this.errors['idNumber'] = 'Số CCCD/CMND không được để trống';
    } else if (this.idNumber.length !== 12) {
      this.errors['idNumber'] = 'Số CCCD phải có 12 ký tự';
    }

    if (!this.birthDate) {
      this.errors['birthDate'] = 'Ngày sinh không được để trống';
    } else if (this.birthDate >= new Date()) {
      this.errors['birthDate'] = 'Ngày sinh phải là ngày trong quá khứ';
    }

    if (!this.address.trim()) {
      this.errors['address'] = 'Địa chỉ không được để trống';
    }

    if (!this.phoneNumber.trim()) {
      this.errors['phoneNumber'] = 'Số điện thoại không được để trống';
    } else if (!/^0\d{9}$/.test(this.phoneNumber)) {
      this.errors['phoneNumber'] = 'Số điện thoại không đúng định dạng';
    }

    if (!this.positionCode.trim()) {
      this.errors['positionCode'] = 'Vị trí không được để trống';
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(this.positionCode)) {
      this.errors['positionCode'] = 'Vị trí chỉ được chứa chữ cái và khoảng trắng';
    }
  }

  private validateFiles(): void {
    if (!this.avatarFile) {
      this.errors['avatar'] = 'Ảnh đại diện không được để trống';
    }

    if (!this.cvFile) {
      this.errors['cv'] = 'CV không được để trống';
    }
  }

  private validateInternship(): void {
    if (!this.isInternPosition()) {
      return;
    }

    if (!this.internshipStartDate) {
      this.errors['internshipStartDate'] = 'Ngày bắt đầu thực tập không được để trống';
    }

    if (!this.internshipEndDate) {
      this.errors['internshipEndDate'] = 'Ngày kết thúc thực tập không được để trống';
    }

    if (
      this.internshipStartDate &&
      this.internshipEndDate &&
      this.internshipEndDate <= this.internshipStartDate
    ) {
      this.errors['internshipEndDate'] = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
  }
}
