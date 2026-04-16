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
    <div className="flex items-center w-full justify-between relative mt-2 py-1">
      {/* Track */}
      <div className="absolute left-0 top-[22px] w-full h-1 bg-gray-200 rounded-full" />
      {/* Progress */}
      <div
        className="absolute left-0 top-[22px] h-1 bg-teal-500 rounded-full transition-all duration-700 ease-out"
        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step, idx) => {
        const isPassed = idx < currentStepIndex;
        const isCurrent = idx === currentStepIndex && status !== 'Failed';
        const isFailed = status === 'Failed' && idx === 2;

        return (
          <div key={step} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm transition-colors ${
              isPassed ? 'bg-teal-500 border-teal-500 text-white' :
              isCurrent ? 'bg-electric border-electric text-white animate-pulse' :
              isFailed ? 'bg-red-500 border-red-500 text-white' :
              'bg-white border-gray-300 text-gray-400'
            }`}>
              {isPassed ? <CheckCircle2 className="w-4 h-4" /> :
               (isCurrent && step === 'Processing') ? <Clock className="w-4 h-4" /> :
               (isCurrent && step === 'Initiated') ? <PlayCircle className="w-4 h-4" /> :
               (isCurrent && step === 'Completed') ? <CheckCircle2 className="w-4 h-4" /> :
               isFailed ? <XCircle className="w-4 h-4" /> :
               <div className="w-2 h-2 rounded-full bg-gray-300" />}
            </div>
            <span className={`text-xs font-semibold tracking-wide ${
              isCurrent || isPassed ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};
