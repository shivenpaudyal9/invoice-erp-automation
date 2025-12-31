export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface LineItem {
  id: string;
  invoice_id: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  filename: string;
  upload_date: string;
  status: 'pending' | 'extracted' | 'review' | 'approved' | 'rejected';
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  currency: string;
  validation_status: 'valid' | 'warning' | 'error';
  validation_notes: string[];
  pdf_path: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  ai_model_version: string | null;
  line_items: LineItem[];
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuditLog {
  id: string;
  invoice_id: string;
  timestamp: string;
  action: string;
  user_id: string | null;
  user_email: string | null;
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;
  ai_model: string | null;
  ai_model_version: string | null;
  extra_data: Record<string, unknown> | null;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
}

export interface InvoiceUpdate {
  vendor_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
  line_items?: {
    description?: string;
    quantity?: number;
    unit_price?: number;
    amount?: number;
  }[];
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}
