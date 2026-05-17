import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="status">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
        aria-hidden="true"
      />
      <span className="text-sm text-slate-300">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
      <span className="sr-only">
        WebSocket connection status: {isConnected ? 'connected' : 'disconnected'}
      </span>
    </div>
  );
};

// Made with Bob