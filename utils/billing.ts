export interface BillingBreakdown {
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
}

/**
 * Normalizes billing inputs and calculates totals with caps to prevent negatives.
 */
export const normalizeBilling = (subtotal: number, discount: number, paid: number): BillingBreakdown => {
  const safeSubtotal = Math.max(0, subtotal);
  const safeDiscount = Math.min(Math.max(0, discount), safeSubtotal);
  const total = safeSubtotal - safeDiscount;
  const safePaid = Math.min(Math.max(0, paid), total);
  const balance = Math.max(0, total - safePaid);

  return {
    subtotal: safeSubtotal,
    discount: safeDiscount,
    total,
    paid: safePaid,
    balance,
  };
};

export interface PaymentUpdate {
  applied: number;
  newPaid: number;
  newDue: number;
}

/**
 * Applies a payment to an account, clamping to the remaining balance.
 */
export const applyPayment = (currentPaid: number, netTotal: number, amount: number): PaymentUpdate => {
  const safeNetTotal = Math.max(0, netTotal);
  const safeCurrentPaid = Math.max(0, currentPaid);
  const remaining = Math.max(0, safeNetTotal - safeCurrentPaid);
  const paymentToRecord = Math.min(Math.max(0, amount), remaining);
  const newPaid = safeCurrentPaid + paymentToRecord;
  const newDue = Math.max(0, safeNetTotal - newPaid);

  return {
    applied: paymentToRecord,
    newPaid,
    newDue,
  };
};
