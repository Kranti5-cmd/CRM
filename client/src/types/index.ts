export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Sales Representative';
  phone?: string;
  department?: string;
  salesTarget?: number;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
}

export interface Lead {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  leadSource: string;
  leadStatus: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Converted' | 'Lost';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: User | string;
  value?: number;
  nextFollowUp?: string;
  notes?: string;
  tags?: string[];
  studentId?: string;
  courseName?: string;
  registrationDate?: string;
  paymentStatus?: string;
  registrationStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: Company | string;
  position: string;
  department: string;
  address: string;
  assignedTo: User | string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  _id: string;
  name: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  size: string;
  revenue: number;
  assignedTo: User | string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  _id: string;
  title: string;
  company: Company | string;
  contact: Contact | string;
  value: number;
  stage: 'New Opportunity' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  probability: number;
  assignedTo: User | string;
  expectedCloseDate: string;
  actualCloseDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Follow-up' | 'Demo' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  assignedTo: User | string;
  relatedLead?: Lead | string;
  relatedDeal?: Deal | string;
  relatedContact?: Contact | string;
  dueDate: string;
  completedAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change' | 'deal_update' | 'task_completed';
  description: string;
  user: User | string;
  relatedLead?: Lead | string;
  relatedDeal?: Deal | string;
  relatedContact?: Contact | string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  _id: string;
  user: User | string;
  type: 'lead_assigned' | 'deal_update' | 'task_due' | 'follow_up' | 'system' | 'mention';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedModel?: 'Lead' | 'Deal' | 'Task' | 'Contact';
  createdAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  totalCustomers: number;
  activeDeals: number;
  revenueGenerated: number;
  conversionRate: number;
  pendingFollowUps: number;
  changes: Record<string, number>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
