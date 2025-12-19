import { AnalysisPart, SampleStatus } from '../types';

/**
 * Determines the next request status based on current status and analyses.
 * - Keeps terminal states (Published/Rejected) intact.
 * - Promotes to Verified when all analyses are complete.
 * - Moves pre-testing states into Testing upon first result entry.
 */
export const computeRequestStatus = (
  currentStatus: SampleStatus,
  analyses: AnalysisPart[]
): SampleStatus => {
  const allComplete = analyses.every(a => a.status === 'Complete');

  if ([SampleStatus.PUBLISHED, SampleStatus.REJECTED].includes(currentStatus)) {
    return currentStatus;
  }

  if (allComplete) {
    return SampleStatus.VERIFIED;
  }

  if ([SampleStatus.RECEIVED, SampleStatus.COLLECTED, SampleStatus.IN_LAB].includes(currentStatus)) {
    return SampleStatus.TESTING;
  }

  return currentStatus;
};
