import { useState, useEffect } from 'react';
import { Info, X, Upload, Tag, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const BANNER_DISMISSED_KEY = 'infoBannerDismissed';

export default function InfoBanner() {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed !== 'true') {
      setIsDismissed(false);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="mb-6 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-cyber-cyan flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-rajdhani font-semibold text-cyber-cyan text-sm mb-2">
              HOW TO USE INVOICEAI
            </h3>
            <div className="flex flex-wrap gap-4 text-xs text-gray-300">
              <div className="flex items-center space-x-1.5">
                <Upload className="h-3.5 w-3.5 text-cyber-cyan" />
                <span>
                  <Link to="/upload" className="text-cyber-cyan hover:underline">Upload</Link> a PDF invoice
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Tag className="h-3.5 w-3.5 text-cyber-purple" />
                <span>Add custom fields to extract</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-cyber-green" />
                <span>Review, edit, and approve results</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
