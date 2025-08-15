import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table' | 'list';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animation = 'pulse'
}) => {
  const getAnimationClass = () => {
    switch (animation) {
      case 'wave':
        return 'animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] animate-[wave_1.5s_ease-in-out_infinite]';
      case 'pulse':
        return 'animate-pulse bg-gradient-to-r from-slate-800 to-slate-700';
      default:
        return 'bg-slate-800';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded';
      case 'card':
        return 'rounded-lg';
      default:
        return 'rounded';
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${getAnimationClass()} ${getVariantClasses()} ${index > 0 ? 'mt-2' : ''}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width || '100%'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${getAnimationClass()} ${getVariantClasses()} ${className}`}
      style={style}
    />
  );
};

// Specialized skeleton components
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-800 rounded-lg border border-slate-700 p-6 ${className}`}>
    <LoadingSkeleton variant="text" width="60%" className="mb-4" />
    <LoadingSkeleton variant="text" lines={3} className="mb-4" />
    <LoadingSkeleton variant="rectangular" height={40} width="30%" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => (
  <div className={`bg-slate-800 rounded-lg border border-slate-700 overflow-hidden ${className}`}>
    {/* Header */}
    <div className="border-b border-slate-700 p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <LoadingSkeleton key={index} variant="text" width="80%" />
        ))}
      </div>
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="border-b border-slate-700 last:border-b-0 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton key={colIndex} variant="text" width="90%" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <LoadingSkeleton variant="text" width="60%" className="mb-2" />
          <LoadingSkeleton variant="text" width="40%" />
        </div>
        <LoadingSkeleton variant="rectangular" width={80} height={32} />
      </div>
    ))}
  </div>
);

export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-800 rounded-lg border border-slate-700 p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <LoadingSkeleton variant="text" width="50%" />
      <LoadingSkeleton variant="circular" width={24} height={24} />
    </div>
    <LoadingSkeleton variant="text" width="40%" height={32} className="mb-2" />
    <LoadingSkeleton variant="text" width="60%" />
  </div>
);

export const ChartSkeleton: React.FC<{ className?: string; height?: number }> = ({
  className = '',
  height = 300
}) => (
  <div className={`bg-slate-800 rounded-lg border border-slate-700 p-6 ${className}`}>
    <LoadingSkeleton variant="text" width="40%" className="mb-6" />
    <LoadingSkeleton variant="rectangular" height={height} className="mb-4" />
    <div className="flex justify-center space-x-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingSkeleton key={index} variant="text" width={60} />
      ))}
    </div>
  </div>
);

export const FormSkeleton: React.FC<{ fields?: number; className?: string }> = ({
  fields = 4,
  className = ''
}) => (
  <div className={`bg-slate-800 rounded-lg border border-slate-700 p-6 ${className}`}>
    <LoadingSkeleton variant="text" width="30%" className="mb-6" />
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <LoadingSkeleton variant="text" width="25%" className="mb-2" />
          <LoadingSkeleton variant="rectangular" height={40} />
        </div>
      ))}
    </div>
    <div className="flex justify-end space-x-3 mt-6">
      <LoadingSkeleton variant="rectangular" width={80} height={40} />
      <LoadingSkeleton variant="rectangular" width={100} height={40} />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 p-6 bg-slate-900 min-h-screen ${className}`}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <LoadingSkeleton variant="text" width="30%" height={32} />
      <LoadingSkeleton variant="rectangular" width={120} height={40} />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>

    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton height={400} />
      <div className="space-y-4">
        <LoadingSkeleton variant="text" width="40%" className="mb-4" />
        <ListSkeleton items={5} />
      </div>
    </div>
  </div>
);

export default LoadingSkeleton;