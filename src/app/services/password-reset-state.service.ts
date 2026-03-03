import { Injectable, signal } from '@angular/core';
import { PasswordResetReason } from '../models/login.model';

@Injectable({
  providedIn: 'root',
})
export class PasswordResetStateService {
  private readonly _requestId = signal<string | null>(null);
  private readonly _reason = signal<PasswordResetReason>('forgot-password');
  private readonly _email = signal<string>('');
  private readonly _remainingResendAttempts = signal<number>(0);
  private readonly _nextResendInSeconds = signal<number>(60);

  get requestId() {
    return this._requestId;
  }
  get reason() {
    return this._reason;
  }
  get email() {
    return this._email;
  }
  get remainingResendAttempts() {
    return this._remainingResendAttempts;
  }
  get nextResendInSeconds() {
    return this._nextResendInSeconds;
  }

  setRequestId(id: string) {
    this._requestId.set(id);
  }
  setReason(reason: PasswordResetReason) {
    this._reason.set(reason);
  }
  setEmail(email: string) {
    this._email.set(email);
  }
  setRemainingResendAttempts(attempts: number) {
    this._remainingResendAttempts.set(attempts);
  }
  setNextResendInSeconds(seconds: number) {
    this._nextResendInSeconds.set(seconds);
  }

  clear() {
    this._requestId.set(null);
    this._reason.set('forgot-password');
    this._email.set('');
    this._remainingResendAttempts.set(0);
    this._nextResendInSeconds.set(60);
  }
}
