import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export function CardGridSkeleton({ count = 6, cols = "md:grid-cols-2 xl:grid-cols-3" }: { count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-1 ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="shadow-soft">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PageLoadingSkeleton({ title = true }: { title?: boolean }) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {title && (
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        )}
        <CardGridSkeleton count={6} />
      </div>
    </DashboardLayout>
  );
}


export function StatCardSkeleton() {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2" style={{ height }}>
          {[60, 80, 45, 90, 70, 55, 75].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReceiptRowSkeleton() {
  return (
    <Card className="border-0 shadow-soft">
      <CardContent className="p-3 flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2 items-end flex flex-col">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ReceiptListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ReceiptRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-4 space-y-3">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-3 py-2 border-t border-border/50"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 w-full max-w-[80%]" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function HeroCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-xl">
      <CardContent className="p-6 bg-primary/10 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-full mt-4" />
      </CardContent>
    </Card>
  );
}
