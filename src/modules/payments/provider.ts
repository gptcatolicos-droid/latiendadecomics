export type PaymentProviderStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'failed' | 'needs_review';

export interface NormalizedPaymentTransaction {
  provider: string;
  externalId: string;
  orderId?: string | null;
  status: PaymentProviderStatus;
  providerStatus?: string | null;
  amountMinor: number;
  currency: string;
  paymentMethod?: string | null;
  occurredAt?: Date;
}

export interface PaymentProvider {
  readonly id: string;
  readonly displayName: string;
  isConfigured(): boolean;
  createPayment(input: unknown): Promise<unknown>;
  getTransaction(externalId: string): Promise<NormalizedPaymentTransaction>;
  refund?(transactionId: string, amountMinor?: number): Promise<unknown>;
  validateWebhook(request: Request): Promise<boolean>;
}
