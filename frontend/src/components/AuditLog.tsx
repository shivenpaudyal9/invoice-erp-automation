import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { auditApi } from '../services/api';
import {
  History,
  Filter,
  Loader2,
  Upload,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  ExternalLink,
  Cpu,
} from 'lucide-react';

const actionIcons: Record<string, React.ReactNode> = {
  upload: <Upload className="h-4 w-4 text-cyber-cyan" />,
  extract: <FileText className="h-4 w-4 text-cyber-purple" />,
  edit: <Edit className="h-4 w-4 text-yellow-400" />,
  approve: <CheckCircle className="h-4 w-4 text-cyber-green" />,
  reject: <XCircle className="h-4 w-4 text-cyber-pink" />,
  export: <Download className="h-4 w-4 text-gray-400" />,
  reextract: <RefreshCw className="h-4 w-4 text-cyber-cyan" />,
};

const actionColors: Record<string, string> = {
  upload: 'border-cyber-cyan',
  extract: 'border-cyber-purple',
  edit: 'border-yellow-400',
  approve: 'border-cyber-green',
  reject: 'border-cyber-pink',
  export: 'border-gray-400',
  reextract: 'border-cyber-cyan',
};

export default function AuditLog() {
  const [actionFilter, setActionFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [limit, setLimit] = useState(50);

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', actionFilter, userFilter, limit],
    queryFn: () =>
      auditApi.getAll({
        action: actionFilter || undefined,
        user_email: userFilter || undefined,
        limit,
      }),
  });

  if (error) {
    return (
      <div className="glass-card text-center py-12">
        <XCircle className="h-12 w-12 mx-auto text-cyber-pink mb-4" />
        <p className="text-cyber-pink font-rajdhani">Failed to load audit logs</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <History className="h-8 w-8 text-cyber-cyan" />
          <h1 className="text-2xl font-orbitron font-bold text-white">AUDIT LOG</h1>
        </div>
        <span className="text-sm text-gray-400 font-rajdhani">
          {data?.total || 0} TOTAL ENTRIES
        </span>
      </div>

      {/* Filters */}
      <div className="glass-card mb-6">
        <div className="flex items-center flex-wrap gap-4">
          <Filter className="h-5 w-5 text-cyber-cyan" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="cyber-select w-40"
          >
            <option value="">All Actions</option>
            <option value="upload">Upload</option>
            <option value="extract">Extract</option>
            <option value="edit">Edit</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="export">Export</option>
            <option value="reextract">Re-extract</option>
          </select>
          <input
            type="text"
            placeholder="Filter by email..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="cyber-input w-48"
          />
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="cyber-select w-32"
          >
            <option value="25">25 entries</option>
            <option value="50">50 entries</option>
            <option value="100">100 entries</option>
            <option value="250">250 entries</option>
          </select>
        </div>
      </div>

      {/* Audit Log List */}
      <div className="glass-card">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-cyber-cyan mb-4" />
            <p className="text-gray-400 font-rajdhani">LOADING LOGS...</p>
          </div>
        ) : data?.logs.length === 0 ? (
          <div className="text-center py-16">
            <History className="h-16 w-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 font-rajdhani text-lg">NO AUDIT LOGS FOUND</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.logs.map((log) => (
              <div
                key={log.id}
                className={`border-l-2 ${actionColors[log.action] || 'border-gray-400'} bg-white/5 rounded-r-xl p-4 hover:bg-white/10 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 p-2 bg-white/5 rounded-lg">
                      {actionIcons[log.action] || <FileText className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-white uppercase font-rajdhani">
                          {log.action}
                        </span>
                        <Link
                          to={`/invoices/${log.invoice_id}`}
                          className="text-cyber-cyan hover:text-cyber-pink text-sm flex items-center space-x-1 transition-colors"
                        >
                          <span>Invoice</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <p className="text-sm text-gray-400">
                        {log.user_email || 'System'} •{' '}
                        {new Date(log.timestamp).toLocaleString()}
                      </p>

                      {/* AI Info */}
                      {log.ai_model && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Cpu className="h-3 w-3 text-cyber-purple" />
                          <p className="text-xs text-cyber-purple">
                            {log.ai_model} v{log.ai_model_version}
                          </p>
                        </div>
                      )}

                      {/* Changes */}
                      {log.changes && (
                        <div className="mt-3">
                          {log.changes.before && log.changes.after && (
                            <div className="bg-black/30 rounded-lg p-3 space-y-1">
                              {Object.keys(log.changes.after).map((key) => {
                                const before = log.changes?.before?.[key];
                                const after = log.changes?.after?.[key];
                                if (before !== after) {
                                  return (
                                    <div key={key} className="flex items-center space-x-2 text-xs font-mono">
                                      <span className="text-gray-400">{key}:</span>
                                      <span className="text-cyber-pink line-through">
                                        {String(before ?? 'null')}
                                      </span>
                                      <span className="text-gray-500">→</span>
                                      <span className="text-cyber-green">
                                        {String(after ?? 'null')}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Extra Data */}
                      {log.extra_data && Object.keys(log.extra_data).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 font-mono">
                          {Object.entries(log.extra_data).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {log.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
