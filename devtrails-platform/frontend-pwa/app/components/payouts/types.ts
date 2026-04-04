export type PayoutStatus = 'Initiated' | 'Processing' | 'Completed' | 'Failed';

export interface PayoutRecord {
  id: string;
  claimId: string;
  amount: number;
  currency: string;
  method: string;
  status: PayoutStatus;
  initiatedAt: string;
  completedAt?: string;
  destination: string;
}
