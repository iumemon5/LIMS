import { describe, it, expect } from 'vitest';
import { computeRequestStatus } from '../utils/analysis';
import { SampleStatus, AnalysisPart } from '../types';

const baseAnalyses: AnalysisPart[] = [
  { keyword: 'GLU', title: 'Glucose', price: 100, unit: 'mg/dL', status: 'Pending' },
  { keyword: 'CBC', title: 'CBC', price: 200, unit: '10^9/L', status: 'Pending' },
];

describe('computeRequestStatus', () => {
  it('keeps terminal statuses unchanged', () => {
    const status = computeRequestStatus(SampleStatus.PUBLISHED, [
      { ...baseAnalyses[0], status: 'Complete' },
      { ...baseAnalyses[1], status: 'Complete' },
    ]);
    expect(status).toBe(SampleStatus.PUBLISHED);
  });

  it('promotes to Testing when results are entered from pre-testing states', () => {
    const status = computeRequestStatus(SampleStatus.RECEIVED, [
      { ...baseAnalyses[0], status: 'Complete' },
      { ...baseAnalyses[1], status: 'Pending' },
    ]);
    expect(status).toBe(SampleStatus.TESTING);
  });

  it('promotes to Verified when all analyses are complete', () => {
    const status = computeRequestStatus(SampleStatus.TESTING, [
      { ...baseAnalyses[0], status: 'Complete' },
      { ...baseAnalyses[1], status: 'Complete' },
    ]);
    expect(status).toBe(SampleStatus.VERIFIED);
  });
});
