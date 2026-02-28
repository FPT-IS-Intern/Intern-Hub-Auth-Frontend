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
import { PositionResponse } from "../../services/register-user.service";
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
  private readonly cdr = inject(ChangeDetectorRef);

  positions: PositionResponse[] = [];

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
  birthDateStr: string = '';
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

  onlyDateInput(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowedKeys.includes(event.key)) return;
    if (!/^[0-9/]$/.test(event.key)) {
      event.preventDefault();
      this.errors['birthDate'] = 'Chỉ được nhập số và dấu /';
    }
  }

  onlyNumber(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowedKeys.includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // --- HANDLER PASTE CHO INPUT SỐ VÀ NGÀY ---
  onIdNumberPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') || '';
    if (/\D/.test(pasted)) {
      event.preventDefault();
      this.errors['idNumber'] = 'Số CCCD chỉ được chứa chữ số (0-9)';
    }
  }
  onPhoneNumberPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') || '';
    if (/\D/.test(pasted)) {
      event.preventDefault();
      this.errors['phoneNumber'] = 'SĐT chỉ được chứa số';
    }
  }
  onBirthDatePaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') || '';
    if (!/^[0-9/]*$/.test(pasted)) {
      event.preventDefault();
      this.errors['birthDate'] = 'Chỉ được nhập số và dấu /';
    }
  }

  onEmailInput(value: string): void {
    this.email = value.trim();
    if (!this.email) {
      this.errors['email'] = 'Email không được để trống';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errors['email'] = 'Email không đúng định dạng';
      return;
    }
    if (!this.email.toLowerCase().endsWith('@fpt.com')) {
      this.errors['email'] = 'Email phải kết thúc bằng @fpt.com';
      return;
    }
    delete this.errors['email'];
  }
  onEmailBlur(): void {
    this.onEmailInput(this.email);
  }

  onFullNameInput(value: string): void {
    this.fullName = value.trim();
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!this.fullName) {
      this.errors['fullName'] = 'Họ tên không được để trống';
    } else if (this.fullName.length > 100) {
      this.errors['fullName'] = 'Họ tên không quá 100 ký tự';
    } else if (!nameRegex.test(this.fullName)) {
      this.errors['fullName'] = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
    } else {
      delete this.errors['fullName'];
    }
  }

  onIdNumberInput(value: string): void {
    if (/\D/.test(value)) {
      this.errors['idNumber'] = 'Số CCCD chỉ được chứa chữ số (0-9)';
      this.idNumber = value.replace(/\D/g, '');
      return;
    }
    this.idNumber = value;
    if (!value) {
      this.errors['idNumber'] = 'Số CCCD không được để trống';
    } else if (value.length !== 12) {
      this.errors['idNumber'] = 'Số CCCD phải có 12 chữ số';
    } else {
      delete this.errors['idNumber'];
    }
  }

  onPhoneNumberInput(value: string): void {
    if (/\D/.test(value)) {
      this.errors['phoneNumber'] = 'SĐT chỉ được chứa số';
      this.phoneNumber = value.replace(/\D/g, '');
      return;
    }
    this.phoneNumber = value;
    if (!value) {
      this.errors['phoneNumber'] = 'SĐT không được để trống';
    } else if (!/^0\d{9}$/.test(value)) {
      this.errors['phoneNumber'] = 'SĐT phải 10 số và bắt đầu bằng 0';
    } else {
      delete this.errors['phoneNumber'];
    }
  }

  onBirthDateInput(value: string): void {
    this.birthDateStr = value;
    if (!/^[0-9/]*$/.test(value)) {
      this.errors['birthDate'] = 'Chỉ được nhập số và dấu /';
      this.birthDate = null;
      return;
    }
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(value)) {
      this.errors['birthDate'] = 'Định dạng phải là DD/MM/YYYY';
      this.birthDate = null;
      return;
    }
    const [day, month, year] = value.split('/').map(Number);
    const inputDate = new Date(year, month - 1, day);
    if (inputDate >= new Date()) {
      this.errors['birthDate'] = 'Ngày sinh phải là ngày trong quá khứ';
      this.birthDate = null;
      return;
    }
    this.birthDate = inputDate;
    delete this.errors['birthDate'];
  }

  onAddressInput(value: string): void {
    this.address = value?.trim() || '';

    if (!this.address) {
      this.errors['address'] = 'Địa chỉ không được để trống';
    } else {
      delete this.errors['address'];
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
    if (!this.positionCode.trim()) {
      this.errors['positionCode'] = 'Vị trí không được để trống';
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(this.positionCode)) {
      this.errors['positionCode'] = 'Vị trí chỉ được chứa chữ cái và khoảng trắng';
    } else {
      delete this.errors['positionCode'];
    }
  }

  onPositionSelect(value: string): void {
    this.positionCode = value;
    this.onPositionInput(value);
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

  loadPositions(): void {
    this.registerUserService.getPositions().subscribe({
      next: (response) => {
        this.positions = response.data || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load positions', error);
      }
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
    } else if (!this.email.toLowerCase().endsWith('@fpt.com')) {
      this.errors['email'] = 'Email phải kết thúc bằng @fpt.com';
    }
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!this.fullName.trim()) {
      this.errors['fullName'] = 'Họ tên không được để trống';
    } else if (this.fullName.length > 100) {
      this.errors['fullName'] = 'Họ tên không quá 100 ký tự';
    } else if (!nameRegex.test(this.fullName)) {
      this.errors['fullName'] = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
    }
    if (!this.idNumber.trim()) {
      this.errors['idNumber'] = 'Số CCCD/CMND không được để trống';
    } else if (this.idNumber.length !== 12) {
      this.errors['idNumber'] = 'Số CCCD phải có 12 chữ số';
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
