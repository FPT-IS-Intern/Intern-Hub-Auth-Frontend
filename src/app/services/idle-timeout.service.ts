import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { PasswordResetStateService } from './password-reset-state.service';

/**
 * IdleTimeoutService
 *
 * Theo dõi hoạt động của người dùng (click, keydown, mousemove, touchstart).
 * Nếu không có hoạt động nào trong IDLE_TIMEOUT_MS (10 phút), tự động
 * chuyển hướng về trang đăng nhập và xóa trạng thái phiên đặt lại mật khẩu.
 *
 * Sử dụng: Gọi start() trong ngOnInit() và stop() trong ngOnDestroy()
 * của tất cả các component thuộc luồng quên mật khẩu / OTP / đặt lại mật khẩu.
 */
@Injectable({
  providedIn: 'root',
})
export class IdleTimeoutService {
  private readonly IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 phút

  private readonly router = inject(Router);
  private readonly passwordResetState = inject(PasswordResetStateService);
  private readonly ngZone = inject(NgZone);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly activityEvents = ['click', 'keydown', 'mousemove', 'touchstart'];
  private boundResetTimer = () => this.resetTimer();
  private refCount = 0; // đếm số component đang dùng service

  /** Bắt đầu theo dõi idle. Gọi từ ngOnInit(). */
  start(): void {
    this.refCount++;
    if (this.refCount === 1) {
      // Chạy listener bên ngoài Angular zone để tránh trigger change detection liên tục
      this.ngZone.runOutsideAngular(() => {
        this.activityEvents.forEach(event =>
          document.addEventListener(event, this.boundResetTimer, { passive: true })
        );
      });
    }
    this.resetTimer();
  }

  /** Dừng theo dõi idle. Gọi từ ngOnDestroy(). */
  stop(): void {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0) {
      this.clearTimer();
      this.activityEvents.forEach(event =>
        document.removeEventListener(event, this.boundResetTimer)
      );
    }
  }

  private resetTimer(): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.ngZone.run(() => {
        this.passwordResetState.clear();
        this.router.navigate(['/auth/login']);
      });
    }, this.IDLE_TIMEOUT_MS);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
