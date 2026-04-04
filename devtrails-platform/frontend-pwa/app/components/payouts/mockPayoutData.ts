import { PayoutRecord } from './types';

export const mockPayouts: PayoutRecord[] = [
  {
    id: 'TRX-99B-8832',
    claimId: 'CLM-009A-44X',
    amount: 3250.00,
    currency: 'USD',
    method: 'Direct Bank Transfer',
    status: 'Processing',
    initiatedAt: '2026-04-03T09:15:00Z',
    destination: '**** **** **** 4221'
  },
  {
    id: 'TRX-77A-1100',
    claimId: 'CLM-881B-10Y',
    amount: 1500.00,
    currency: 'USD',
    method: 'Digital Wallet',
    status: 'Completed',
    initiatedAt: '2026-03-20T14:30:00Z',
    completedAt: '2026-03-20T14:35:00Z',
    destination: 'pay@example.com'
  },
  {
    id: 'TRX-22Z-4491',
    claimId: 'CLM-330C-99Z',
    amount: 8400.00,
    currency: 'USD',
    method: 'Wire Transfer',
    status: 'Completed',
    initiatedAt: '2026-02-15T11:00:00Z',
    completedAt: '2026-02-16T09:00:00Z',
    destination: '**** **** **** 8832'
  }
];
