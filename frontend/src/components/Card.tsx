import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div
      className={`
        bg-slate-900 rounded-lg
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${border ? 'border border-slate-700' : ''}
        ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  trend,
  loading = false,
  className = ''
}) => {
  const iconColorClasses = {
    blue: 'bg-blue-900/20 text-blue-400',
    green: 'bg-green-900/20 text-green-400',
    red: 'bg-red-900/20 text-red-400',
    purple: 'bg-purple-900/20 text-purple-400',
    orange: 'bg-orange-900/20 text-orange-400',
    gray: 'bg-gray-900/20 text-gray-400'
  };

  if (loading) {
    return (
      <Card className={className} hover>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-1/3"></div>
            </div>
            <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className} hover>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-400 truncate">{title}</p>
          <p className="text-2xl font-bold text-white mt-1 truncate">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-full flex-shrink-0 ${iconColorClasses[iconColor as keyof typeof iconColorClasses]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;