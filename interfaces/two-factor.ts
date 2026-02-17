// Інтерфейси для Two-Factor Authentication (TOTP)

export interface TwoFactorSetup {
  secret: string; // Base32 encoded secret
  qrCodeUrl: string; // Data URL для QR коду
  backupCodes: string[]; // 10 recovery codes
}

export interface RecoveryCode {
  id: string;
  userId: string;
  code: string;
  used: boolean;
  usedAt: Date | null;
  createdAt: Date;
}

export interface TwoFactorStatus {
  enabled: boolean;
  backupCodesCount?: number; // Кількість невикористаних кодів
}

export interface VerifyTwoFactorInput {
  code: string; // 6-digit TOTP code або recovery code
  isRecoveryCode?: boolean;
}

export interface EnableTwoFactorResult {
  success: boolean;
  error?: string;
  data?: TwoFactorSetup;
}

export interface VerifyTwoFactorResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface DisableTwoFactorResult {
  success: boolean;
  error?: string;
  message?: string;
}
