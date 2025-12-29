'use client';

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Users } from 'lucide-react';
import { MentorStats } from '@/components/mentor/dashboard/MentorStats';
import { RecentSubmissions } from '@/components/mentor/dashboard/RecentSubmissions';

export default function MentorDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mentor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Review submissions and guide your mentees
        </p>
      </div>

      <MentorStats />

      <RecentSubmissions />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/mentor/tasks/assign">
            <CardHeader>
              <Plus className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Assign Task</CardTitle>
              <CardDescription>
                Create and assign a new task to your mentees
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/mentor/tasks/review">
            <CardHeader>
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Review Queue</CardTitle>
              <CardDescription>
                Review pending task submissions
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/mentor/mentees">
            <CardHeader>
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>View Mentees</CardTitle>
              <CardDescription>
                Track progress and manage your mentees
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
