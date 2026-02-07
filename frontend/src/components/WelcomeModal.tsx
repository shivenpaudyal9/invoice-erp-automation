import { useState, useEffect } from 'react';
import { Upload, Cpu, CheckCircle, Download, X, Zap } from 'lucide-react';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const shouldShow = localStorage.getItem('showWelcome');
    if (shouldShow === 'true') {
      setIsOpen(true);
      localStorage.removeItem('showWelcome');
    }
  }, []);

  if (!isOpen) return null;

  const features = [
    {
      icon: <Upload className="h-8 w-8 text-cyber-cyan" />,
      title: 'UPLOAD',
      description: 'Drop any PDF invoice, receipt, or bill for instant processing.',
    },
    {
      icon: <Cpu className="h-8 w-8 text-cyber-purple" />,
      title: 'AI EXTRACTION',
      description: 'Gemini AI extracts key data plus your custom fields automatically.',
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-cyber-green" />,
      title: 'REVIEW',
      description: 'Verify and edit extracted data with human-in-the-loop validation.',
    },
    {
      icon: <Download className="h-8 w-8 text-cyber-pink" />,
      title: 'EXPORT',
      description: 'Export approved invoices as ERP-ready JSON or CSV files.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative glass-card max-w-lg w-full p-8 animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Zap className="h-14 w-14 text-cyber-cyan" />
              <div className="absolute inset-0 bg-cyber-cyan opacity-40 blur-xl animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-orbitron font-bold text-white mb-2">
            WELCOME TO INVOICE<span className="text-cyber-cyan">AI</span>
          </h2>
          <p className="text-gray-400 font-rajdhani">
            Your AI-powered invoice processing system is ready.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-4 rounded-xl bg-white/5 border border-white/10 text-center"
            >
              <div className="flex justify-center mb-2">{feature.icon}</div>
              <h3 className="font-rajdhani font-semibold text-white text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => setIsOpen(false)}
          className="cyber-btn cyber-btn-primary w-full flex items-center justify-center space-x-2"
        >
          <Zap className="h-5 w-5" />
          <span>GET STARTED</span>
        </button>

        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyber-cyan" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyber-cyan" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyber-cyan" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyber-cyan" />
      </div>
    </div>
  );
}
