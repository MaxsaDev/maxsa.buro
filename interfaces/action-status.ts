export interface BaseActionStatus {
  message: string;
  code?: string;
}

export interface SuccessActionStatus extends BaseActionStatus {
  status: 'success';
}

export interface ErrorActionStatus extends BaseActionStatus {
  status: 'error';
  code?: string;
}

export interface WarningActionStatus extends BaseActionStatus {
  status: 'warning';
}

export interface InfoActionStatus extends BaseActionStatus {
  status: 'info';
}

export interface TwoFactorActionStatus extends BaseActionStatus {
  status: 'two_factor';
  result: {
    email: string;
  };
}

export type ActionStatus =
  | SuccessActionStatus
  | ErrorActionStatus
  | WarningActionStatus
  | InfoActionStatus
  | TwoFactorActionStatus;
