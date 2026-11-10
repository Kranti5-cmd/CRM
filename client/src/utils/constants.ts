export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'New': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Contacted': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Qualified': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Proposal Sent': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'Negotiation': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Converted': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Won': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Lost': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export const DEAL_STAGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'New Opportunity': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Qualification': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Proposal': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'Negotiation': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Won': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Lost': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  'Low': { bg: 'bg-gray-100', text: 'text-gray-600' },
  'Medium': { bg: 'bg-blue-50', text: 'text-blue-700' },
  'High': { bg: 'bg-orange-50', text: 'text-orange-700' },
  'Critical': { bg: 'bg-red-50', text: 'text-red-700' },
};

export const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  'Website': { bg: 'bg-blue-50', text: 'text-blue-700' },
  'Arshith Boot Camp': { bg: 'bg-emerald-50', text: 'text-emerald-800' },
  'Referral': { bg: 'bg-green-50', text: 'text-green-700' },
  'Social Media': { bg: 'bg-purple-50', text: 'text-purple-700' },
  'Cold Call': { bg: 'bg-orange-50', text: 'text-orange-700' },
  'Email Campaign': { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  'Trade Show': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  'Other': { bg: 'bg-gray-50', text: 'text-gray-700' },
};

export const TASK_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Pending': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700' },
  'Completed': { bg: 'bg-green-50', text: 'text-green-700' },
  'Cancelled': { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'] as const;
export const LEAD_SOURCES = ['Website', 'Arshith Boot Camp', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Trade Show', 'Other'] as const;
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const DEAL_STAGES = ['New Opportunity', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const;
export const TASK_TYPES = ['Call', 'Email', 'Meeting', 'Follow-up', 'Demo', 'Other'] as const;
export const TASK_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'] as const;
export const USER_ROLES = ['Admin', 'Manager', 'Sales Representative'] as const;
export const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Consulting', 'Marketing', 'Legal', 'Other',
] as const;
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;

export const CHART_COLORS = ['#4f46e5', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];
