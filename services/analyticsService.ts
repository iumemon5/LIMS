
import { AnalysisRequest, Patient, SampleStatus, Department } from '../types';

interface FinancialMetrics {
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
  todayCollected: number;
  recoveryRate: number;
}

interface OperationalMetrics {
  totalSamples: number;
  completedSamples: number;
  pendingSamples: number;
  criticalSamples: number;
  avgTurnaroundHours: number;
}

export const calculateFinancials = (requests: AnalysisRequest[]): FinancialMetrics => {
  const today = new Date().toISOString().split('T')[0];

  const metrics = requests.reduce((acc, req) => ({
    totalBilled: acc.totalBilled + req.totalFee,
    totalCollected: acc.totalCollected + req.paidAmount,
    outstanding: acc.outstanding + req.dueAmount,
    todayCollected: acc.todayCollected + (req.dateReceived === today ? req.paidAmount : 0)
  }), { totalBilled: 0, totalCollected: 0, outstanding: 0, todayCollected: 0 });

  return {
    ...metrics,
    recoveryRate: metrics.totalBilled > 0 ? (metrics.totalCollected / metrics.totalBilled) * 100 : 0
  };
};

export const calculateOperations = (requests: AnalysisRequest[]): OperationalMetrics => {
  const totalSamples = requests.length;
  const completedSamples = requests.filter(r => r.status === SampleStatus.PUBLISHED || r.status === SampleStatus.VERIFIED).length;
  const criticalSamples = requests.filter(r => r.priority === 'Emergency').length;
  const pendingSamples = totalSamples - completedSamples;

  // Real Turnaround Time Calculation
  // Calculates average hours between creation and last update for verified/published samples
  const completedReqs = requests.filter(r => r.status === SampleStatus.VERIFIED || r.status === SampleStatus.PUBLISHED);
  let totalHours = 0;
  
  if (completedReqs.length > 0) {
    totalHours = completedReqs.reduce((sum, req) => {
      const start = new Date(req.createdAt).getTime();
      const end = new Date(req.updatedAt).getTime();
      const diffHours = (end - start) / (1000 * 60 * 60);
      return sum + diffHours;
    }, 0);
  }
  
  const avgTurnaroundHours = completedReqs.length > 0 ? parseFloat((totalHours / completedReqs.length).toFixed(1)) : 0;

  return {
    totalSamples,
    completedSamples,
    pendingSamples,
    criticalSamples,
    avgTurnaroundHours
  };
};

export const getDepartmentBreakdown = (requests: AnalysisRequest[]) => {
   return {
     haematology: requests.filter(r => r.analyses.some(a => ['CBC', 'ESR', 'APTT'].includes(a.keyword))).length,
     biochemistry: requests.filter(r => r.analyses.some(a => ['LFT', 'RFT', 'GLU'].includes(a.keyword))).length,
   };
};

export const getDepartmentStats = (requests: AnalysisRequest[], departments: Department[]) => {
    // Map requests to departments based on the analysis keywords in the request
    // Note: A request can belong to multiple departments if it has mixed tests, 
    // but usually LIMS separate requests by Dept. We will count occurrences.
    
    const stats = departments.map(dept => {
        const testCodes = dept.tests.map(t => t.code);
        const count = requests.filter(req => 
            req.analyses.some(a => testCodes.includes(a.keyword))
        ).length;
        
        return {
            id: dept.id,
            label: dept.name,
            count,
            total: requests.length || 1, // Avoid division by zero
            color: getDeptColor(dept.id)
        };
    }).sort((a, b) => b.count - a.count); // Sort by volume

    return stats;
};

const getDeptColor = (id: string) => {
    switch(id) {
        case 'HAEM': return 'bg-blue-600';
        case 'BIO': return 'bg-indigo-600';
        case 'MICRO': return 'bg-emerald-500';
        case 'IMM': return 'bg-rose-500';
        default: return 'bg-slate-500';
    }
};

export const getReferrerStats = (requests: AnalysisRequest[]) => {
  const counts = requests.reduce((acc: Record<string, number>, curr) => {
      const name = curr.referrer || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
  }, {});
  
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  return {
    topReferrer: sorted[0] ? sorted[0][0] : 'None',
    topCount: sorted[0] ? sorted[0][1] : 0,
    ranking: sorted
  };
};

export const getVolumeTrend = (requests: AnalysisRequest[]) => {
    // Group by Month (MMM) for the last 6 months or based on available data
    // For this dashboard, we will show dynamic aggregation
    
    const months: Record<string, { samples: number, published: number, order: number }> = {};
    
    requests.forEach(req => {
        const date = new Date(req.dateReceived);
        const key = date.toLocaleString('default', { month: 'short' });
        const isPublished = req.status === SampleStatus.PUBLISHED || req.status === SampleStatus.VERIFIED;
        
        if (!months[key]) {
            months[key] = { samples: 0, published: 0, order: date.getMonth() };
        }
        
        months[key].samples += 1;
        if (isPublished) months[key].published += 1;
    });

    // If no data, return a placeholder to prevent chart crash
    if (Object.keys(months).length === 0) {
        return [{ name: 'No Data', samples: 0, published: 0 }];
    }

    return Object.entries(months)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([name, data]) => ({
            name,
            samples: data.samples,
            published: data.published
        }));
};
