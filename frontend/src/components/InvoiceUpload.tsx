import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Loader2, X, Cpu, Zap, Sparkles, Plus, Tag } from 'lucide-react';
import { invoiceApi } from '../services/api';
import toast from 'react-hot-toast';

const SUGGESTED_FIELDS = [
  'PO Number',
  'Payment Terms',
  'Shipping Address',
  'Billing Address',
  'Contact Email',
  'Tax ID',
  'Project Code',
  'Department',
  'Contract Number',
  'Delivery Date',
  'Discount',
];

export default function InvoiceUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [fieldInput, setFieldInput] = useState('');
  const navigate = useNavigate();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      toast.error('Only PDF files are accepted');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast.error('Only PDF files are accepted');
      }
    }
  };

  const addField = () => {
    const trimmed = fieldInput.trim();
    if (trimmed && !customFields.includes(trimmed)) {
      setCustomFields((prev) => [...prev, trimmed]);
      setFieldInput('');
    }
  };

  const addSuggestedField = (name: string) => {
    if (!customFields.includes(name)) {
      setCustomFields((prev) => [...prev, name]);
    }
  };

  const removeField = (name: string) => {
    setCustomFields((prev) => prev.filter((f) => f !== name));
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addField();
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const invoice = await invoiceApi.upload(file, customFields.length > 0 ? customFields : undefined);
      toast.success('Document processed successfully');
      navigate(`/invoices/${invoice.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Cpu className="h-8 w-8 text-cyber-cyan" />
        <h1 className="text-2xl font-orbitron font-bold text-white">DOCUMENT UPLOAD</h1>
      </div>

      <div className="glass-card">
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              isDragOver
                ? 'border-cyber-cyan bg-cyber-cyan/10 shadow-[0_0_30px_rgba(0,255,255,0.2)]'
                : 'border-white/20 hover:border-cyber-cyan/50 hover:bg-white/5'
            }`}
          >
            <div className="relative inline-block mb-6">
              <Upload className="h-16 w-16 text-cyber-cyan" />
              <div className="absolute inset-0 bg-cyber-cyan opacity-30 blur-xl animate-pulse" />
            </div>

            <p className="text-xl text-gray-300 font-rajdhani mb-2">
              DROP YOUR DOCUMENT HERE
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Invoices, receipts, bills, purchase orders - we process them all
            </p>

            <label className="cyber-btn cyber-btn-primary cursor-pointer inline-flex items-center space-x-2">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Sparkles className="h-4 w-4" />
              <span>BROWSE FILES</span>
            </label>

            <p className="text-xs text-gray-500 mt-6 font-rajdhani">
              SUPPORTED: PDF DOCUMENTS
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Preview */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FileText className="h-12 w-12 text-cyber-pink" />
                  <div className="absolute inset-0 bg-cyber-pink opacity-30 blur-md" />
                </div>
                <div>
                  <p className="font-semibold text-white font-rajdhani">{file.name}</p>
                  <p className="text-sm text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
              >
                <X className="h-5 w-5 text-gray-400 group-hover:text-cyber-pink" />
              </button>
            </div>

            {/* Custom Fields Section */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center space-x-2 mb-3">
                <Tag className="h-5 w-5 text-cyber-purple" />
                <h3 className="font-rajdhani font-semibold text-white text-sm">CUSTOM EXTRACTION FIELDS</h3>
                <span className="text-xs text-gray-500">(optional)</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Add field names you want the AI to extract from this document.
              </p>

              {/* Input row */}
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={fieldInput}
                  onChange={(e) => setFieldInput(e.target.value)}
                  onKeyDown={handleFieldKeyDown}
                  placeholder="e.g. PO Number, Payment Terms..."
                  className="cyber-input flex-1 text-sm"
                />
                <button
                  onClick={addField}
                  disabled={!fieldInput.trim()}
                  className="cyber-btn cyber-btn-secondary text-sm flex items-center space-x-1 disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                  <span>ADD</span>
                </button>
              </div>

              {/* Suggested presets */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {SUGGESTED_FIELDS.filter((f) => !customFields.includes(f)).map((name) => (
                  <button
                    key={name}
                    onClick={() => addSuggestedField(name)}
                    className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-400 hover:border-cyber-purple/50 hover:text-cyber-purple transition-colors"
                  >
                    + {name}
                  </button>
                ))}
              </div>

              {/* Selected fields as pills */}
              {customFields.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customFields.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-purple text-sm"
                    >
                      <span>{name}</span>
                      <button
                        onClick={() => removeField(name)}
                        className="hover:text-cyber-pink transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="cyber-btn cyber-btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>EXTRACT DATA</span>
                  </>
                )}
              </button>
              <button
                onClick={clearFile}
                className="cyber-btn cyber-btn-secondary"
                disabled={isUploading}
              >
                CANCEL
              </button>
            </div>

            {/* Processing Info */}
            {isUploading && (
              <div className="bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Cpu className="h-6 w-6 text-cyber-cyan animate-pulse" />
                    <div className="absolute inset-0 bg-cyber-cyan opacity-50 blur-md" />
                  </div>
                  <div>
                    <p className="text-cyber-cyan font-rajdhani font-semibold">
                      AI EXTRACTION IN PROGRESS
                    </p>
                    <p className="text-sm text-gray-400">
                      Analyzing document structure and extracting financial data
                      {customFields.length > 0 && ` + ${customFields.length} custom field${customFields.length > 1 ? 's' : ''}`}...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="glass-card text-center p-4">
          <Sparkles className="h-8 w-8 text-cyber-cyan mx-auto mb-2" />
          <p className="text-sm text-gray-300 font-rajdhani">SMART EXTRACTION</p>
          <p className="text-xs text-gray-500">AI-powered parsing</p>
        </div>
        <div className="glass-card text-center p-4">
          <FileText className="h-8 w-8 text-cyber-purple mx-auto mb-2" />
          <p className="text-sm text-gray-300 font-rajdhani">CUSTOM FIELDS</p>
          <p className="text-xs text-gray-500">Extract any data you need</p>
        </div>
        <div className="glass-card text-center p-4">
          <Zap className="h-8 w-8 text-cyber-green mx-auto mb-2" />
          <p className="text-sm text-gray-300 font-rajdhani">INSTANT RESULTS</p>
          <p className="text-xs text-gray-500">Real-time processing</p>
        </div>
      </div>
    </div>
  );
}
