import React from 'react';
import { ShoppingCart, ExternalLink } from 'lucide-react';

interface EcommerceDemoProps {
  onBack?: () => void;
}

export const EcommerceDemo: React.FC<EcommerceDemoProps> = ({ onBack }) => {
  const demoUrl = 'https://ecom-navy-three.vercel.app/';

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart size={28} className="text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold gradient-text mb-1">E-Commerce Demo</h1>
                <p className="text-sm text-slate-400">Live demo of e-commerce application</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-sm"
              >
                <ExternalLink size={16} />
                <span>Open in New Tab</span>
              </a>
              {onBack && (
                <button onClick={onBack} className="btn-ghost btn-sm">
                  ← Back to Incidents
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Embedded Demo */}
      <main className="p-6">
        <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
          <iframe
            src={demoUrl}
            className="w-full h-full border-0"
            title="E-Commerce Demo"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
          />
        </div>

        {/* Info Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <ShoppingCart size={20} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Full E-Commerce</h3>
            </div>
            <p className="text-sm text-slate-400">
              Complete shopping experience with product catalog, cart, and checkout
            </p>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Responsive Design</h3>
            </div>
            <p className="text-sm text-slate-400">
              Optimized for all devices - desktop, tablet, and mobile
            </p>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Modern Stack</h3>
            </div>
            <p className="text-sm text-slate-400">
              Built with React, TypeScript, and modern web technologies
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-400">
              <p>
                Demo hosted on{' '}
                <span className="text-blue-400 font-semibold">Vercel</span>
              </p>
            </div>
            <div className="text-slate-500 text-xs">
              E-Commerce Demo Application
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Made with Bob