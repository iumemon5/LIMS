import { describe, it, expect } from 'vitest';
import { normalizeBilling, applyPayment } from '../utils/billing';

describe('normalizeBilling', () => {
  it('caps discount and paid at logical limits', () => {
    const result = normalizeBilling(1000, 1200, 900);
    expect(result.discount).toBe(1000);
    expect(result.total).toBe(0);
    expect(result.paid).toBe(0);
    expect(result.balance).toBe(0);
  });

  it('rejects negative inputs and keeps math consistent', () => {
    const result = normalizeBilling(800, -50, -25);
    expect(result.discount).toBe(0);
    expect(result.paid).toBe(0);
    expect(result.total).toBe(800);
    expect(result.balance).toBe(800);
  });

  it('caps paid to the total payable', () => {
    const result = normalizeBilling(500, 100, 600);
    expect(result.total).toBe(400);
    expect(result.paid).toBe(400);
    expect(result.balance).toBe(0);
  });
});

describe('applyPayment', () => {
  it('prevents negative or zero payments from applying', () => {
    const update = applyPayment(100, 500, -50);
    expect(update.applied).toBe(0);
    expect(update.newPaid).toBe(100);
    expect(update.newDue).toBe(400);
  });

  it('caps overpayments to the remaining balance', () => {
    const update = applyPayment(200, 500, 400);
    expect(update.applied).toBe(300);
    expect(update.newPaid).toBe(500);
    expect(update.newDue).toBe(0);
  });

  it('applies exact remaining balance correctly', () => {
    const update = applyPayment(150, 500, 350);
    expect(update.applied).toBe(350);
    expect(update.newPaid).toBe(500);
    expect(update.newDue).toBe(0);
  });
});
