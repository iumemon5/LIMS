
/**
 * @file formatters.ts
 * @description Centralized utility functions for data presentation.
 */

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('PKR', 'Rs.');
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (isoString: string): string => {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};
