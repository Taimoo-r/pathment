'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  /** Number of skeleton rows */
  rows?: number;
  /** Number of columns to fake */
  cols?: number;
  /** Show a header skeleton row */
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 8,
  cols = 4,
  showHeader = true,
}: TableSkeletonProps) {
  const colArray = Array.from({ length: cols });
  const rowArray = Array.from({ length: rows });

  // First col gets a wider skeleton (usually a name/title)
  const widths = ['w-32', 'w-24', 'w-20', 'w-28'];

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {colArray.map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className={`h-4 ${widths[i % widths.length]}`} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}

        <TableBody>
          {rowArray.map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {colArray.map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton
                    className={`h-4 ${
                      colIdx === 0
                        ? 'w-36'
                        : colIdx % 3 === 0
                        ? 'w-16'
                        : colIdx % 2 === 0
                        ? 'w-24'
                        : 'w-20'
                    }`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
