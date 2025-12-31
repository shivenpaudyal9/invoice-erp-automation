import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  AlertTriangle,
  Loader2,
  History,
  Cpu,
  Zap,
  Shield,
} from 'lucide-react';
import { invoiceApi, exportApi, auditApi } from '../services/api';
import LineItemsTable from './LineItemsTable';
import type { Invoice, InvoiceUpdate, LineItem, AuditLog } from '../types/invoice';
import toast from 'react-hot-toast';

export default function InvoiceReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<InvoiceUpdate>({});
  const [editedLineItems, setEditedLineItems] = useState<LineItem[]>([]);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.get(id!),
    enabled: !!id,
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => auditApi.getInvoiceAudit(id!),
    enabled: !!id && showAudit,
  });

  const updateMutation = useMutation({
    mutationFn: (data: InvoiceUpdate) => invoiceApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['audit', id] });
      setIsEditing(false);
      toast.success('Invoice updated');
    },
    onError: () => toast.error('Update failed'),
  });

  const approveMutation = useMutation({
    mutationFn: () => invoiceApi.approve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['audit', id] });
      toast.success('Invoice approved');
    },
    onError: () => toast.error('Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => invoiceApi.reject(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['audit', id] });
      toast.success('Invoice rejected');
    },
    onError: () => toast.error('Rejection failed'),
  });

  const reextractMutation = useMutation({
    mutationFn: () => invoiceApi.reextract(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['audit', id] });
      toast.success('Re-extraction complete');
    },
    onError: () => toast.error('Re-extraction failed'),
  });

  const startEditing = () => {
    if (invoice) {
      setEditedInvoice({
        vendor_name: invoice.vendor_name || undefined,
        invoice_number: invoice.invoice_number || undefined,
        invoice_date: invoice.invoice_date || undefined,
        due_date: invoice.due_date || undefined,
        subtotal: invoice.subtotal || undefined,
        tax: invoice.tax || undefined,
        total: invoice.total || undefined,
        currency: invoice.currency,
      });
      setEditedLineItems([...invoice.line_items]);
      setIsEditing(true);
    }
  };

  const saveChanges = () => {
    updateMutation.mutate({
      ...editedInvoice,
      line_items: editedLineItems.map((item) => ({
        description: item.description || undefined,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      })),
    });
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setEditedLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-cyber-cyan mb-4" />
        <p className="text-gray-400 font-rajdhani">LOADING DATA...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="glass-card text-center py-12">
        <XCircle className="h-12 w-12 mx-auto text-cyber-pink mb-4" />
        <p className="text-cyber-pink font-rajdhani">Invoice not found</p>
      </div>
    );
  }

  const isProcessing =
    updateMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    reextractMutation.isPending;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-cyber-cyan" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <Cpu className="h-6 w-6 text-cyber-cyan" />
              <h1 className="text-2xl font-orbitron font-bold text-white">
                {invoice.invoice_number || invoice.id.slice(0, 8)}
              </h1>
            </div>
            <p className="text-sm text-gray-400 font-rajdhani ml-9">{invoice.filename}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={statusColors[invoice.status]}>
            {invoice.status.toUpperCase()}
          </span>
          <span className={validationColors[invoice.validation_status]}>
            {invoice.validation_status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Validation Warnings */}
      {invoice.validation_notes && invoice.validation_notes.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-rajdhani font-semibold text-yellow-400">VALIDATION ISSUES</h3>
              <ul className="mt-2 text-sm text-yellow-200/80 space-y-1">
                {invoice.validation_notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-orbitron font-semibold text-white">INVOICE DATA</h2>
              {!isEditing && invoice.status !== 'approved' && (
                <button onClick={startEditing} className="cyber-btn cyber-btn-secondary text-sm">
                  EDIT
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-rajdhani font-semibold text-gray-400 mb-2">
                  VENDOR NAME
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedInvoice.vendor_name || ''}
                    onChange={(e) =>
                      setEditedInvoice((prev) => ({
                        ...prev,
                        vendor_name: e.target.value,
                      }))
                    }
                    className="cyber-input"
                  />
                ) : (
                  <p className="text-white font-rajdhani">{invoice.vendor_name || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-semibold text-gray-400 mb-2">
                  INVOICE NUMBER
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedInvoice.invoice_number || ''}
                    onChange={(e) =>
                      setEditedInvoice((prev) => ({
                        ...prev,
                        invoice_number: e.target.value,
                      }))
                    }
                    className="cyber-input"
                  />
                ) : (
                  <p className="text-white font-rajdhani">{invoice.invoice_number || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-semibold text-gray-400 mb-2">
                  INVOICE DATE
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedInvoice.invoice_date || ''}
                    onChange={(e) =>
                      setEditedInvoice((prev) => ({
                        ...prev,
                        invoice_date: e.target.value,
                      }))
                    }
                    className="cyber-input"
                  />
                ) : (
                  <p className="text-white font-rajdhani">{invoice.invoice_date || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-semibold text-gray-400 mb-2">
                  DUE DATE
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedInvoice.due_date || ''}
                    onChange={(e) =>
                      setEditedInvoice((prev) => ({
                        ...prev,
                        due_date: e.target.value,
                      }))
                    }
                    className="cyber-input"
                  />
                ) : (
                  <p className="text-white font-rajdhani">{invoice.due_date || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-semibold text-gray-400 mb-2">
                  CURRENCY
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedInvoice.currency || 'USD'}
                    onChange={(e) =>
                      setEditedInvoice((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    className="cyber-input"
                  />
                ) : (
                  <p className="text-white font-rajdhani">{invoice.currency}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
              <div>
                <label className="block text-xs font-rajdhani font-semibold text-gray-400 mb-2">
                  SUBTOTAL
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedInvoice.subtotal || ''}
                    onChange={(e) =>
                      setEditedInvoice((prev) => ({
                        ...prev,
                        subtotal: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="cyber-input"
                  />
                ) : (
                  <p className="text-white font-mono">
                    {invoice.subtotal?.toFixed(2) || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-semibold text-gray-400 mb-2">
                  TAX
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedInvoice.tax || ''}
                    onChange={(e) =>
                      setEditedInvoice((prev) => ({
                        ...prev,
                        tax: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="cyber-input"
                  />
                ) : (
                  <p className="text-white font-mono">{invoice.tax?.toFixed(2) || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-semibold text-gray-400 mb-2">
                  TOTAL
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedInvoice.total || ''}
                    onChange={(e) =>
                      setEditedInvoice((prev) => ({
                        ...prev,
                        total: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="cyber-input"
                  />
                ) : (
                  <p className="text-2xl font-bold text-cyber-green font-mono">
                    {invoice.currency} {invoice.total?.toFixed(2) || '-'}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-3 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={saveChanges}
                  disabled={isProcessing}
                  className="cyber-btn cyber-btn-primary flex items-center space-x-2"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>SAVE CHANGES</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="cyber-btn cyber-btn-secondary"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="glass-card">
            <h2 className="text-lg font-orbitron font-semibold text-white mb-4">LINE ITEMS</h2>
            <LineItemsTable
              lineItems={isEditing ? editedLineItems : invoice.line_items}
              editable={isEditing}
              onChange={handleLineItemChange}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="glass-card">
            <h2 className="text-lg font-orbitron font-semibold text-white mb-4">ACTIONS</h2>
            <div className="space-y-3">
              {invoice.status === 'review' && (
                <>
                  <button
                    onClick={() => approveMutation.mutate()}
                    disabled={isProcessing}
                    className="cyber-btn cyber-btn-success w-full flex items-center justify-center space-x-2"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span>APPROVE</span>
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate()}
                    disabled={isProcessing}
                    className="cyber-btn cyber-btn-danger w-full flex items-center justify-center space-x-2"
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>REJECT</span>
                  </button>
                </>
              )}

              <button
                onClick={() => reextractMutation.mutate()}
                disabled={isProcessing || invoice.status === 'approved'}
                className="cyber-btn cyber-btn-secondary w-full flex items-center justify-center space-x-2"
              >
                {reextractMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>RE-EXTRACT</span>
              </button>

              <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
                <button
                  onClick={() => exportApi.downloadInvoiceJson(id!)}
                  className="cyber-btn cyber-btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>EXPORT JSON</span>
                </button>
                <button
                  onClick={() => exportApi.downloadInvoiceCsv(id!)}
                  className="cyber-btn cyber-btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>EXPORT CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Processing Info */}
          <div className="glass-card">
            <h2 className="text-lg font-orbitron font-semibold text-white mb-4">SYSTEM INFO</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center space-x-3">
                <Zap className="h-4 w-4 text-cyber-cyan" />
                <div>
                  <p className="text-gray-400 text-xs">UPLOADED</p>
                  <p className="text-white font-rajdhani">
                    {new Date(invoice.upload_date).toLocaleString()}
                  </p>
                </div>
              </div>
              {invoice.ai_model_version && (
                <div className="flex items-center space-x-3">
                  <Cpu className="h-4 w-4 text-cyber-purple" />
                  <div>
                    <p className="text-gray-400 text-xs">AI MODEL</p>
                    <p className="text-white font-rajdhani">{invoice.ai_model_version}</p>
                  </div>
                </div>
              )}
              {invoice.reviewed_by && (
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-cyber-green" />
                  <div>
                    <p className="text-gray-400 text-xs">REVIEWED BY</p>
                    <p className="text-white font-rajdhani">{invoice.reviewed_by}</p>
                  </div>
                </div>
              )}
              {invoice.reviewed_at && (
                <div className="flex items-center space-x-3">
                  <History className="h-4 w-4 text-cyber-pink" />
                  <div>
                    <p className="text-gray-400 text-xs">REVIEWED AT</p>
                    <p className="text-white font-rajdhani">
                      {new Date(invoice.reviewed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit Log Toggle */}
          <div className="glass-card">
            <button
              onClick={() => setShowAudit(!showAudit)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center space-x-2">
                <History className="h-5 w-5 text-cyber-cyan" />
                <span className="font-orbitron font-semibold text-white">AUDIT TRAIL</span>
              </div>
              <span className="text-sm text-cyber-cyan font-rajdhani">
                {showAudit ? 'HIDE' : 'SHOW'}
              </span>
            </button>

            {showAudit && auditData && (
              <div className="mt-4 space-y-3">
                {auditData.logs.map((log: AuditLog) => (
                  <div
                    key={log.id}
                    className="border-l-2 border-cyber-cyan/50 pl-3 py-1"
                  >
                    <p className="text-sm font-semibold text-white uppercase font-rajdhani">
                      {log.action}
                    </p>
                    <p className="text-xs text-gray-400">
                      {log.user_email || 'System'} •{' '}
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                    {log.ai_model && (
                      <p className="text-xs text-cyber-purple">AI: {log.ai_model}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
