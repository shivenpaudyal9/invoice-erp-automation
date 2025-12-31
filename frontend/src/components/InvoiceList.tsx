import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { invoiceApi, exportApi } from '../services/api';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Cpu,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-400" />,
  extracted: <FileText className="h-4 w-4 text-cyber-cyan" />,
  review: <AlertCircle className="h-4 w-4 text-cyber-purple" />,
  approved: <CheckCircle className="h-4 w-4 text-cyber-green" />,
  rejected: <XCircle className="h-4 w-4 text-cyber-pink" />,
};

const statusColors: Record<string, string> = {
  pending: 'cyber-badge-warning',
  extracted: 'cyber-badge-info',
  review: 'cyber-badge-purple',
  approved: 'cyber-badge-success',
  rejected: 'cyber-badge-danger',
};

const validationColors: Record<string, string> = {
  valid: 'cyber-badge-success',
  warning: 'cyber-badge-warning',
  error: 'cyber-badge-danger',
};

export default function InvoiceList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [validationFilter, setValidationFilter] = useState<string>('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const pageSize = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', page, statusFilter, validationFilter],
    queryFn: () =>
      invoiceApi.list({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        validation_status: validationFilter || undefined,
      }),
  });

  const toggleSelect = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (data?.invoices) {
      if (selectedInvoices.length === data.invoices.length) {
        setSelectedInvoices([]);
      } else {
        setSelectedInvoices(data.invoices.map((i) => i.id));
      }
    }
  };

  const handleBatchExport = async (format: 'json' | 'csv') => {
    if (selectedInvoices.length === 0) {
      toast.error('Select at least one invoice to export');
      return;
    }

    try {
      if (format === 'json') {
        await exportApi.batchJson(selectedInvoices);
      } else {
        await exportApi.batchCsv(selectedInvoices);
      }
      toast.success(`Exported ${selectedInvoices.length} invoices`);
    } catch {
      toast.error('Failed to export invoices');
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  if (error) {
    return (
      <div className="glass-card text-center py-12">
        <XCircle className="h-12 w-12 mx-auto text-cyber-pink mb-4" />
        <p className="text-cyber-pink font-rajdhani">Failed to load invoices</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Cpu className="h-8 w-8 text-cyber-cyan" />
          <h1 className="text-2xl font-orbitron font-bold text-white">INVOICE DATABASE</h1>
        </div>
        <Link to="/upload" className="cyber-btn cyber-btn-primary flex items-center space-x-2">
          <Zap className="h-4 w-4" />
          <span>UPLOAD NEW</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card mb-6">
        <div className="flex items-center flex-wrap gap-4">
          <Filter className="h-5 w-5 text-cyber-cyan" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="cyber-select w-40"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="extracted">Extracted</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={validationFilter}
            onChange={(e) => {
              setValidationFilter(e.target.value);
              setPage(1);
            }}
            className="cyber-select w-40"
          >
            <option value="">All Validation</option>
            <option value="valid">Valid</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          {selectedInvoices.length > 0 && (
            <div className="flex items-center space-x-3 ml-auto">
              <span className="text-sm text-cyber-cyan font-rajdhani">
                {selectedInvoices.length} SELECTED
              </span>
              <button
                onClick={() => handleBatchExport('json')}
                className="cyber-btn cyber-btn-secondary text-sm flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>JSON</span>
              </button>
              <button
                onClick={() => handleBatchExport('csv')}
                className="cyber-btn cyber-btn-secondary text-sm flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-cyber-cyan mb-4" />
            <p className="text-gray-400 font-rajdhani">LOADING DATA...</p>
          </div>
        ) : data?.invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 font-rajdhani text-lg mb-2">NO INVOICES FOUND</p>
            <Link to="/upload" className="text-cyber-cyan hover:text-cyber-pink transition-colors font-rajdhani">
              Upload your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === data?.invoices.length}
                      onChange={selectAll}
                      className="cyber-checkbox"
                    />
                  </th>
                  <th>INVOICE</th>
                  <th>VENDOR</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                  <th>VALIDATION</th>
                  <th>DATE</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data?.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleSelect(invoice.id)}
                        className="cyber-checkbox"
                      />
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-white">
                          {invoice.invoice_number || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">{invoice.filename}</p>
                      </div>
                    </td>
                    <td className="text-gray-300">
                      {invoice.vendor_name || 'Unknown'}
                    </td>
                    <td className="font-mono text-cyber-green font-semibold">
                      {invoice.total
                        ? `${invoice.currency} ${invoice.total.toFixed(2)}`
                        : 'N/A'}
                    </td>
                    <td>
                      <span className={`${statusColors[invoice.status]} flex items-center space-x-1 w-fit`}>
                        {statusIcons[invoice.status]}
                        <span className="uppercase">{invoice.status}</span>
                      </span>
                    </td>
                    <td>
                      <span className={validationColors[invoice.validation_status]}>
                        {invoice.validation_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-gray-400 text-sm">
                      {new Date(invoice.upload_date).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="inline-flex items-center space-x-1 text-cyber-cyan hover:text-cyber-pink transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>VIEW</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > pageSize && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400 font-rajdhani">
              SHOWING {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} OF {data.total}
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="cyber-btn cyber-btn-secondary p-2 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-300 font-mono">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="cyber-btn cyber-btn-secondary p-2 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
