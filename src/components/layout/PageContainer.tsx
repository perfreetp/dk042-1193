import { ReactNode } from 'react';

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function PageContainer({
  title, subtitle, actions, children, className = '',
}: PageContainerProps) {
  return (
    <div className={`flex-1 flex flex-col overflow-hidden animate-fade-in-up ${className}`}>
      {(title || actions) && (
        <div className="flex-shrink-0 px-8 pt-6 pb-4">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="page-title flex items-center gap-3">
                  <span className="w-1 h-7 rounded-full bg-gradient-gold inline-block" />
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1.5 text-sm text-gray-500 pl-4">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
          <div className="gold-divider mt-4" />
        </div>
      )}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {children}
      </div>
    </div>
  );
}
