'use client';

import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Target, Users, Star, Loader2, ArrowLeft } from 'lucide-react';
import { useProgramEnroll } from '@/lib/hooks/mentee';
import { PageHeader } from '@/components/admin/ui';

export default function ProgramEnrollment() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const {
    program,
    loading,
    enrolling,
    existingEnrollment,
    showConfirmDialog,
    setShowConfirmDialog,
    handleEnroll,
  } = useProgramEnroll(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <p className="text-slate-600 mb-4">Program not found</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader backHref="/mentee/programs" backLabel="Back" />

      {/* Program Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-slate-900 mb-3">{program.name}</h1>
            <p className="text-slate-600 mb-4">{program.description}</p>
            <div className="flex flex-wrap gap-2">
              {program.skillTags?.map((skill: string) => (
                <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-6 p-6 bg-slate-50 rounded-xl">
          <div className="text-center">
            <div className="text-slate-900 text-2xl mb-1">{program.currentEnrollments || 0}</div>
            <div className="text-slate-600 text-sm flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              Enrolled
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-900 text-2xl mb-1">{program.estimatedHoursPerWeek || 0}</div>
            <div className="text-slate-600 text-sm flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" />
              Hrs/week
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-900 text-2xl mb-1">{program.totalDurationWeeks || 0}</div>
            <div className="text-slate-600 text-sm">Weeks</div>
          </div>
        </div>
      </div>

      {/* Program Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-slate-900 mb-4">Program Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-slate-600 text-sm">Duration</div>
                <div className="text-slate-900">{program.totalDurationWeeks} weeks</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-slate-600 text-sm">Type</div>
                <div className="text-slate-900 capitalize">{program.type || 'Not specified'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-slate-600 text-sm">Time Commitment</div>
                <div className="text-slate-900">{program.estimatedHoursPerWeek || 0} hrs/week</div>
              </div>
            </div>
          </div>
        </div>

        {/* What you'll learn */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-slate-900 mb-4">What you&apos;ll learn</h2>
          {program.learningOutcomes && program.learningOutcomes.length > 0 ? (
            <ul className="space-y-2">
              {program.learningOutcomes.map((outcome: string, idx: number) => (
                <li key={idx} className="text-slate-600 text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">
              Once you&apos;re enrolled and matched, your mentor assigns roadmaps and tasks tailored to you.
            </p>
          )}
        </div>
      </div>

      {/* Enrollment CTA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="max-w-xl mx-auto text-center">
          {existingEnrollment ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-slate-900 mb-3">Already Enrolled</h2>
              <p className="text-slate-600 mb-6">
                You are already enrolled in this program with status: <strong className="capitalize">{existingEnrollment.status.replace(/_/g, ' ')}</strong>
              </p>
              <button
                onClick={() => router.push('/mentee/programs')}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
              >
                View My Programs
              </button>
            </>
          ) : (
            <>
              <h2 className="text-slate-900 mb-3">Ready to Start Your Journey?</h2>
              <p className="text-slate-600 mb-6">
                Submit your enrollment request and our admin team will review it. Once approved, you&apos;ll be matched with an expert mentor.
              </p>
              <button
                onClick={() => setShowConfirmDialog(true)}
                disabled={enrolling}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-colors"
              >
                {enrolling ? 'Submitting...' : 'Request Enrollment'}
              </button>
              <p className="text-slate-500 text-sm mt-4">
                Admin will review your request within 24-48 hours
              </p>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-slate-900 text-center mb-3">Confirm Enrollment Request</h2>
            <p className="text-slate-600 text-center mb-6">
              Submit enrollment request for <strong>{program.name}</strong>. The admin will review and approve your request before mentor matching.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={enrolling}
                className="flex-1 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-colors"
              >
                {enrolling ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
