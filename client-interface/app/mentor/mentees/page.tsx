'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, TrendingUp, CheckCircle2, Loader2, MessageSquare, Clock } from 'lucide-react';
import { useMentorMentees } from '@/lib/hooks/mentor';
import { StatsCard, SearchAndFilterBar, ProgressBar, StatusBadge } from '@/components/admin/ui';

export default function MyMentees() {
  const router = useRouter();
  const {
    matches,
    filteredMatches,
    programs,
    loading,
    searchTerm,
    filterProgram,
    setSearchTerm,
    setFilterProgram,
  } = useMentorMentees();

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 25) return 'bg-yellow-600';
    return 'bg-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 mb-2">My Mentees</h1>
        <p className="text-slate-600">Track and support your mentees' learning progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatsCard
          icon={Users}
          label="Total Mentees"
          value={matches.length}
          colorClass="text-indigo-600 bg-indigo-100"
        />
        <StatsCard
          icon={TrendingUp}
          label="Avg Progress"
          value={`${matches.length > 0
            ? Math.round(matches.reduce((acc, m) => acc + (parseFloat(m.enrollment?.overallProgressPercentage) || 0), 0) / matches.length)
            : 0}%`}
          colorClass="text-green-600 bg-green-100"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Programs"
          value={programs.length}
          colorClass="text-purple-600 bg-purple-100"
        />
      </div>

      {/* Filters */}
      <SearchAndFilterBar
        search={searchTerm}
        onSearch={setSearchTerm}
        placeholder="Search by name or program..."
        filters={[
          {
            value: filterProgram,
            onChange: setFilterProgram,
            options: [
              { value: 'all', label: 'All Programs' },
              ...programs.map((p) => ({ value: p, label: p })),
            ],
          },
        ]}
      />

      {/* Mentees List */}
      <div className="bg-white rounded-2xl border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">
              {searchTerm || filterProgram !== 'all' ? 'No mentees found' : 'No mentees assigned yet'}
            </p>
            <p className="text-slate-500 text-sm">
              {searchTerm || filterProgram !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Your mentees will appear here once admin assigns them'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredMatches.map((match) => {
              const mentee = match.mentee;
              const enrollment = match.enrollment;
              const progress = parseFloat(enrollment?.overallProgressPercentage) || 0;

              return (
                <Link
                  key={match.id}
                  href={`/mentor/mentees/${match.menteeId}`}
                  className="block p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-indigo-200 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-indigo-700 text-lg">
                        {mentee?.firstName?.[0]}{mentee?.lastName?.[0]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-slate-900 text-lg mb-1">
                            {mentee?.firstName} {mentee?.lastName}
                          </h3>
                          <p className="text-slate-600 text-sm">
                            {mentee?.email}
                          </p>
                        </div>
                        <StatusBadge status="active" />
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-slate-700 text-sm">
                            {enrollment?.program?.name || 'Unknown Program'}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 text-sm">
                            {match?.level?.name || enrollment?.currentLevel?.name || 'Level 1'}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 text-sm">
                            Week {enrollment?.currentWeek || 1}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <ProgressBar
                          value={progress}
                          color={getProgressColor(progress)}
                          sub="Overall Progress"
                        />
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-4 h-4" />
                          Matched {match.matchedAt ? new Date(match.matchedAt).toLocaleDateString() : 'Recently'}
                        </span>
                        {/* TODO: Add pending tasks count when API is ready */}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (mentee?.id) {
                          router.push(`/mentor/messages?participantId=${mentee.id}`);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
