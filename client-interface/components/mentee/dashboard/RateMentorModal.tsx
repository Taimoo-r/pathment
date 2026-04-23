'use client';

import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';

interface RateMentorModalProps {
  mentorName: string;
  programName: string;
  onSubmit: (rating: number) => Promise<void>;
  onClose: () => void;
}

export function RateMentorModal({ mentorName, programName, onSubmit, onClose }: RateMentorModalProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await onSubmit(selected);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-slate-900 text-xl font-semibold mb-1">Rate Your Mentor</h2>
          <p className="text-slate-500 text-sm">
            How was your experience with <strong className="text-slate-700">{mentorName}</strong> in{' '}
            <strong className="text-slate-700">{programName}</strong>?
          </p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(star)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= (hovered || selected)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Label */}
        <div className="h-6 text-center mb-6">
          {(hovered || selected) > 0 && (
            <span className="text-sm font-medium text-slate-600">
              {LABELS[hovered || selected]}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors text-sm flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
}
