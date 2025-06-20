import React from 'react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  className,
}) => {
  return (
    <div className={cn(
      "glass-card p-6 rounded-xl transition-all duration-300 hover:shadow-glow-purple hover:scale-[1.02]",
      className
    )}>
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 mr-3 flex items-center justify-center rounded-full bg-token-purple/20 text-token-purple">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gradient-purple-blue">{title}</h3>
      </div>
      <p className="text-white/80">{description}</p>
    </div>
  );
};

export default FeatureCard;