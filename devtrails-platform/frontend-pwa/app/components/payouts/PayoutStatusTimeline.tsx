import React from 'react';
import { CheckCircle2, Clock, PlayCircle, XCircle } from 'lucide-react';
import { PayoutStatus } from './types';

interface TimelineProps {
  status: PayoutStatus;
  initiatedAt: string;
  completedAt?: string;
}

export const PayoutStatusTimeline = ({ status }: TimelineProps) => {
  const steps: PayoutStatus[] = ['Initiated', 'Processing', 'Completed'];

  const currentStepIndex = steps.indexOf(status) !== -1
    ? steps.indexOf(status)
    : (status === 'Failed' ? 1 : 0);

  return (
    <div className="flex items-center w-full justify-between relative mt-2">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full" />

      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full transition-all duration-700 ease-out"
        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step, idx) => {
        const isPassed = idx < currentStepIndex;
        const isCurrent = idx === currentStepIndex && status !== 'Failed';
        const isFailed = status === 'Failed' && idx === 2;

        return (
          <div key={step} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-sm transition-colors ${
              isPassed ? 'bg-emerald-500 border-emerald-500 text-white' :
              isCurrent ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse' :
              isFailed ? 'bg-red-500 border-red-500 text-white' :
              'bg-gray-900 border-gray-700 text-gray-500'
            }`}>
              {isPassed ? <CheckCircle2 className="w-4 h-4" /> :
               (isCurrent && step === 'Processing') ? <Clock className="w-4 h-4" /> :
               (isCurrent && step === 'Initiated') ? <PlayCircle className="w-4 h-4" /> :
               (isCurrent && step === 'Completed') ? <CheckCircle2 className="w-4 h-4" /> :
               isFailed ? <XCircle className="w-4 h-4" /> :
               <div className="w-2 h-2 rounded-full bg-current opacity-50" />}
            </div>
            <span className={`text-xs font-semibold tracking-wide ${isCurrent || isPassed ? 'text-gray-200' : 'text-gray-500'}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};
