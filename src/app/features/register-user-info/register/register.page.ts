import {CommonModule} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';


import {
  AvatarUploadButtonComponent,
  AvatarUploadedFile,
  ButtonContainerComponent,
  DatePickerComponent,
  InputTextComponent,
} from '@goat-bravos/intern-hub-layout';
import {ProcessStep, ProcessStepComponent} from '../process-step/process-step.component';
import {TermsPopupComponent} from '../terms-popup.component';
import {RegisterUserService} from '../../../services/register-user.service';
import {PositionResponse} from "../../../services/register-user.service";
import {RegisterUserRequest} from '../../../models/register.model';
import imageCompression from 'browser-image-compression';

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
export class RegisterPage implements OnInit, OnDestroy, AfterViewInit {
  private readonly registerUserService = inject(RegisterUserService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);
  private readonly AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024;
  private readonly AVATAR_SOURCE_MAX_FILE_SIZE = 10 * 1024 * 1024;
  private readonly AVATAR_TARGET_COMPRESSED_SIZE = 80 * 1024;

  @ViewChild('birthDatePicker', {read: ElementRef}) birthDatePickerRef!: ElementRef;
  private birthDateInputListener: (() => void) | null = null;

  positions: PositionResponse[] = [];
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 phút

  ngOnInit() {
    this.loadPositions();
    this.startInactivityTimer();
  }

  ngAfterViewInit(): void {
    this.attachBirthDateInputListener();
  }

  ngOnDestroy(): void {
    this.clearInactivityTimer();
    this.detachBirthDateInputListener();
    this.revokeAvatarPreviewUrl();
  }

  private attachBirthDateInputListener(): void {
    const pickerEl = this.birthDatePickerRef?.nativeElement;
    if (!pickerEl) return;
    const input = pickerEl.querySelector('input') as HTMLInputElement;
    if (!input) return;
    const handler = () => this.onBirthDateTyping(input.value);
    input.addEventListener('input', handler);
    this.birthDateInputListener = () => input.removeEventListener('input', handler);
  }

  private detachBirthDateInputListener(): void {
    this.birthDateInputListener?.();
    this.birthDateInputListener = null;
  }

  private onBirthDateTyping(value: string): void {
    const dateRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(value)) return;

    const [day, month, year] = value.split('/').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (parsed.getDate() !== day || parsed.getMonth() !== month - 1 || parsed.getFullYear() !== year) return;

    this.birthDate = parsed;
    this.onBirthDateChange(parsed);
    this.changeDetectorRef.detectChanges();
  }

  private startInactivityTimer(): void {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      if (this.currentStep === 1) {
        this.goBackToLogin();
      }
    }, this.INACTIVITY_TIMEOUT);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }


  steps: ProcessStep[] = [
    {stepNumber: 1, label: 'Thông tin cá nhân'},
    {stepNumber: 2, label: 'Xem lại thông tin'},
    {stepNumber: 3, label: 'Hoàn thành'},
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

  async onAvatarChange(file: AvatarUploadedFile | null): Promise<void> {
    if (!file?.file) {
      this.clearAvatarSelection();
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.file.type)) {
      this.errors['avatar'] = 'Sai định dạng (chỉ nhận .png, .jpg).';
      this.clearAvatarSelection();
      return;
    }

    if (file.file.size > this.AVATAR_SOURCE_MAX_FILE_SIZE) {
      this.errors['avatar'] = 'File gốc vượt quá 10MB';
      this.clearAvatarSelection();
      return;
    }

    try {
      const compressedAvatar = await this.compressAvatarImage(file.file);
      if (compressedAvatar.size > this.AVATAR_MAX_FILE_SIZE) {
        this.errors['avatar'] = 'File vượt quá 2MB';
        this.clearAvatarSelection();
        return;
      }

      this.revokeAvatarPreviewUrl();
      this.avatarFile = compressedAvatar;
      this.avatarPreviewUrl = URL.createObjectURL(compressedAvatar);
      delete this.errors['avatar'];
    } catch {
      this.errors['avatar'] = 'Không thể xử lý ảnh. Vui lòng chọn ảnh khác.';
      this.clearAvatarSelection();
      return;
    }
  }

  private clearAvatarSelection(): void {
    this.revokeAvatarPreviewUrl();
    this.avatarFile = null;
    this.avatarPreviewUrl = null;
  }

  private revokeAvatarPreviewUrl(): void {
    if (this.avatarPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.avatarPreviewUrl);
    }
  }

  private async compressAvatarImage(file: File): Promise<File> {
    // skip file nhỏ
    if (file.size <= this.AVATAR_TARGET_COMPRESSED_SIZE) {
      return file;
    }

    const options = {
      maxSizeMB: this.AVATAR_TARGET_COMPRESSED_SIZE / (1024 * 1024),
      maxWidthOrHeight: 256,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.75,
    };

    try {
      const compressedBlob = await imageCompression(file, options);

      console.log('Original:', file.size);
      console.log('Compressed:', compressedBlob.size);

      //fallback tránh phình
      if (compressedBlob.size >= file.size) {
        return file;
      }

      return this.createAvatarFile(compressedBlob, file.name);
    } catch (error) {
      console.error('Lỗi khi nén ảnh:', error);
      return file;
    }
  }

  private createAvatarFile(blob: Blob, originalName: string): File {
    const extension = 'webp';
    const normalizedName = originalName.replace(/\.[^.]+$/, '');
    return new File([blob], `${normalizedName}.${extension}`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  }


  onCvChange(file: AvatarUploadedFile | null): void {
    if (!file?.file) {
      this.cvFile = null;
      this.cvFileName = '';
      return;
    }
    const fileName = file.file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      this.errors['cv'] = 'Sai định dạng (chỉ nhận .pdf, .docx).';
      this.cvFile = null;
      this.cvFileName = '';
      return;
    }
    if (file.file.size > 10 * 1024 * 1024) {
      this.errors['cv'] = 'File vượt quá 10MB';
      this.cvFile = null;
      this.cvFileName = '';
      return;
    }
    this.cvFile = file.file;
    this.cvFileName = file.fileName || '';
    delete this.errors['cv'];
  }

  onTermsChange(): void {
    if (this.agreeTerms) {
      delete this.errors['agreeTerms'];
    }
  }

  /** Chặn nhập bàn phím vào date picker, chỉ cho chọn ngày từ lịch */
  preventDateInput(event: KeyboardEvent): void {
    if (event.key === 'Tab') return;
    event.preventDefault();
  }

  onlyNumber(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowedKeys.includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  readonly EMAIL_MAX_LENGTH = 254;

  readonly VALID_PHONE_PREFIXES = [
    '086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039',
    '088', '091', '094', '083', '084', '085', '081', '082',
    '089', '090', '093', '070', '079', '077', '076', '078',
    '092', '056', '058',
    '099', '059',
    '087',
    '055'
  ];

  onEmailInput(value: string): void {
    if (value.length > this.EMAIL_MAX_LENGTH) {
      value = value.substring(0, this.EMAIL_MAX_LENGTH);
    }
    this.email = value.trim();
    if (!this.email) {
      this.errors['email'] = 'Email không được để trống';
      return;
    }
    if (this.email.length > this.EMAIL_MAX_LENGTH) {
      this.errors['email'] = `Email không được vượt quá ${this.EMAIL_MAX_LENGTH} ký tự`;
      return;
    }
    const emailRegex = /^[^\s@]+@fpt\.com$/i;
    if (!emailRegex.test(this.email)) {
      this.errors['email'] = 'Sai định dạng(example@fpt.com)';
      return;
    }
    delete this.errors['email'];
  }

  onFullNameInput(value: string): void {
    this.fullName = value;
    const trimmed = value.trim();
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!trimmed) {
      this.errors['fullName'] = 'Họ & tên không được để trống';
    } else if (trimmed.length >= 100) {
      this.errors['fullName'] = 'Họ & tên không quá 100 ký tự';
    } else if (!nameRegex.test(trimmed)) {
      this.errors['fullName'] = 'Không chứa chữ số và ký tự đặc biệt';
    } else {
      delete this.errors['fullName'];
    }
  }

  onFullNameBlur(): void {
    if (this.fullName) {
      this.fullName = this.fullName
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    this.onFullNameInput(this.fullName);
    this.changeDetectorRef.detectChanges();
  }

  onIdNumberInput(value: string): void {
    if (/\D/.test(value)) {
      this.errors['idNumber'] = 'Nhập 12 số (đối với CCCD gắn chíp) hoặc 9 số (CMND cũ)';
      this.idNumber = value.replace(/\D/g, '').substring(0, 12);
      return;
    }
    if (value.length > 12) {
      value = value.substring(0, 12);
    }
    this.idNumber = value;
    if (!value) {
      this.errors['idNumber'] = 'Nhập 12 số (đối với CCCD gắn chíp) hoặc 9 số (CMND cũ)';
    } else if (value.length !== 9 && value.length !== 12) {
      this.errors['idNumber'] = 'Nhập 12 số (đối với CCCD gắn chíp) hoặc 9 số (CMND cũ)';
    } else {
      delete this.errors['idNumber'];
    }
  }

  onPhoneNumberInput(value: string): void {
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    this.phoneNumber = value;
    if (!value) {
      this.errors['phoneNumber'] = 'Số điện thoại không được để trống';
    } else if (value.length >= 3) {
      const prefix = value.substring(0, 3);
      if (!this.VALID_PHONE_PREFIXES.includes(prefix)) {
        this.errors['phoneNumber'] = 'Số điện thoại không thuộc nhà mạng nào của Việt Nam';
      } else if (!/^0\d{9}$/.test(value)) {
        this.errors['phoneNumber'] = 'Số điện thoại phải có đúng 10 số và bắt đầu bằng 0';
      } else {
        delete this.errors['phoneNumber'];
      }
    } else {
      if (!value.startsWith('0')) {
        this.errors['phoneNumber'] = 'Số điện thoại phải bắt đầu bằng 0';
      } else {
        this.errors['phoneNumber'] = 'Số điện thoại phải có đúng 10 số và bắt đầu bằng 0';
      }
    }
  }

  onAddressBlur(): void {
    if (this.address) {
      this.address = this.address
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    this.onAddressInput(this.address);
    this.changeDetectorRef.detectChanges();
  }

  onAddressInput(value: string): void {
    if (value && value.length > 250) {
      value = value.substring(0, 250);
    }
    this.address = value?.trim() || '';

    if (!this.address) {
      this.errors['address'] = 'Địa chỉ không được để trống';
    } else if (this.address.length > 250) {
      this.errors['address'] = 'Địa chỉ tối đa 250 ký tự';
    } else if (!/^[a-zA-ZÀ-ỹ0-9\s,\/\-\.]+$/.test(this.address)) {
      this.errors['address'] = 'Địa chỉ chỉ được chứa chữ, số và các ký tự , / - .';
    } else if (!/[a-zA-ZÀ-ỹ]/.test(this.address) || !/[0-9]/.test(this.address)) {
      this.errors['address'] = 'Địa chỉ phải bao gồm cả số nhà/ngõ và tên đường.';
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
      const today = new Date();
      if (date >= today) {
        this.errors['birthDate'] = 'Ngày sinh phải nhỏ hơn ngày hiện tại';
        return;
      }
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const dayDiff = today.getDate() - date.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      if (actualAge < 16) {
        this.errors['birthDate'] = 'Bạn phải đủ 16 tuổi trở lên';
        return;
      }
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
      if (this.internshipStartDate && date <= this.internshipStartDate) {
        this.errors['internshipEndDate'] = 'Ngày kết thúc phải sau ngày bắt đầu';
        return;
      }
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

  get isFormValid(): boolean {
    if (Object.keys(this.errors).length > 0) return false;
    if (!this.email || !this.fullName || !this.idNumber || !this.birthDate) return false;
    if (!this.address || !this.phoneNumber || !this.positionCode) return false;
    if (!this.avatarFile || !this.cvFile) return false;
    if (this.isInternPosition() && (!this.internshipStartDate || !this.internshipEndDate)) return false;
    if (!this.agreeTerms) return false;
    return true;
  }

  goToStep2(): void {
    if (!this.validateForm()) {
      return;
    }
    this.clearInactivityTimer();
    this.currentStep = 2;
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  goBackToStep1(): void {
    this.currentStep = 1;
    window.scrollTo({top: 0, behavior: 'smooth'});
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
        this.successMessage = 'Thông tin của bạn đã được gửi đến admin, vui lòng chờ xét duyệt và nhận thông báo từ admin qua mail';
        this.currentStep = 3;
        this.changeDetectorRef.detectChanges();
      },
      error: (error: Error) => {
        this.isLoading = false;
        if (error.message.includes('đã tồn tại') || error.message.includes('xung đột')) {
          this.errors['email'] = 'Tài khoản đã được đăng ký';
          this.errorMessage = 'Tài khoản đã được đăng ký';
        } else {
          this.errorMessage = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        }
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  loadPositions(): void {
    this.registerUserService.getPositions().subscribe({
      next: (response) => {
        if (!response?.data || response.data.length === 0) {
          this.positions = [
            {name: 'BA', positionId: 2},
            {name: 'TES', positionId: 9},
            {name: 'PM', positionId: 4},
            {name: 'INTERN DEV', positionId: 5},
            {name: 'DEV', positionId: 10},
            {name: 'DESIGNER', positionId: 1}
          ];
        } else {
          this.positions = response.data;
        }
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.positions = [
          {name: 'BA', positionId: 2},
          {name: 'TES', positionId: 9},
          {name: 'PM', positionId: 4},
          {name: 'INTERN DEV', positionId: 5},
          {name: 'DEV', positionId: 10},
          {name: 'DESIGNER', positionId: 1}
        ];
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
    // Lưu lại lỗi file (format/size) trước khi reset
    const savedAvatarError = this.errors['avatar'];
    const savedCvError = this.errors['cv'];
    this.errors = {};
    this.validatePersonalInfo();
    this.validateFiles(savedAvatarError, savedCvError);
    this.validateInternship();
    if (!this.agreeTerms) {
      this.errors['agreeTerms'] = 'Bạn phải đồng ý với điều khoản sử dụng';
    }
    return Object.keys(this.errors).length === 0;
  }

  private validatePersonalInfo(): void {
    // Email
    if (!this.email.trim()) {
      this.errors['email'] = 'Email không được để trống';
    } else if (!/^[^\s@]+@fpt\.com$/i.test(this.email)) {
      this.errors['email'] = 'Sai định dạng email';
    }

    // Họ & tên
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!this.fullName.trim()) {
      this.errors['fullName'] = 'Họ & tên không được để trống';
    } else if (this.fullName.length > 100) {
      this.errors['fullName'] = 'Họ & tên không quá 100 ký tự';
    } else if (!nameRegex.test(this.fullName)) {
      this.errors['fullName'] = 'Không chứa chữ số và ký tự đặc biệt';
    }

    // CCCD/CMND: 9 hoặc 12 số
    if (!this.idNumber.trim()) {
      this.errors['idNumber'] = 'Nhập 12 số (đối với CCCD gắn chíp) hoặc 9 số (CMND cũ)';
    } else if (this.idNumber.length !== 9 && this.idNumber.length !== 12) {
      this.errors['idNumber'] = 'Nhập 12 số (đối với CCCD gắn chíp) hoặc 9 số (CMND cũ)';
    }

    // Ngày sinh: < ngày hiện tại và >= 16 tuổi
    if (!this.birthDate) {
      this.errors['birthDate'] = 'Ngày sinh không được để trống';
    } else {
      const today = new Date();
      if (this.birthDate >= today) {
        this.errors['birthDate'] = 'Ngày sinh phải nhỏ hơn ngày hiện tại';
      } else {
        const age = today.getFullYear() - this.birthDate.getFullYear();
        const monthDiff = today.getMonth() - this.birthDate.getMonth();
        const dayDiff = today.getDate() - this.birthDate.getDate();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        if (actualAge < 16) {
          this.errors['birthDate'] = 'Bạn phải đủ 16 tuổi trở lên';
        }
      }
    }

    // Địa chỉ
    if (!this.address.trim()) {
      this.errors['address'] = 'Địa chỉ không được để trống';
    } else if (this.address.length > 250) {
      this.errors['address'] = 'Địa chỉ tối đa 250 ký tự';
    } else if (!/^[a-zA-ZÀ-ỹ0-9\s,\/\-\.]+$/.test(this.address)) {
      this.errors['address'] = 'Địa chỉ chỉ được chứa chữ, số và các ký tự , / - .';
    } else if (!/[a-zA-ZÀ-ỹ]/.test(this.address) || !/[0-9]/.test(this.address)) {
      this.errors['address'] = 'Địa chỉ phải bao gồm cả số nhà/ngõ và tên đường.';
    }

    // Số điện thoại: đúng 10 số bắt đầu bằng 0
    if (!this.phoneNumber.trim()) {
      this.errors['phoneNumber'] = 'Số điện thoại không được để trống';
    } else if (this.phoneNumber.length >= 3 && !this.VALID_PHONE_PREFIXES.includes(this.phoneNumber.substring(0, 3))) {
      this.errors['phoneNumber'] = 'Số điện thoại không thuộc nhà mạng nào của Việt Nam';
    } else if (!/^0\d{9}$/.test(this.phoneNumber)) {
      this.errors['phoneNumber'] = 'Số điện thoại phải có đúng 10 số và bắt đầu bằng 0';
    }

    // Vị trí
    if (!this.positionCode.trim()) {
      this.errors['positionCode'] = 'Vị trí không được để trống';
    }
  }

  private validateFiles(savedAvatarError?: string, savedCvError?: string): void {
    if (!this.avatarFile) {
      this.errors['avatar'] = savedAvatarError || 'Ảnh đại diện không được để trống';
    }
    if (!this.cvFile) {
      this.errors['cv'] = savedCvError || 'CV không được để trống';
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
