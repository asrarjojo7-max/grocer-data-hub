import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopDesigners } from "@/hooks/useDashboardStats";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export function TopDesignersChart() {
  const { data, isLoading } = useTopDesigners(7);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-accent" />
        </div>
        <div>
          <CardTitle>أفضل المصممين هذا الشهر</CardTitle>
          <p className="text-sm text-muted-foreground">حسب إجمالي الأمتار</p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-end gap-2 h-[280px] py-2">
            {[60, 80, 45, 90, 70, 55, 75].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد بيانات بعد</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="full_name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                }}
                formatter={(v: any, name: string) => [
                  `${Number(v).toLocaleString()} ${name === "totalMeters" ? "م" : "ج.س"}`,
                  name === "totalMeters" ? "الأمتار" : "العمولة",
                ]}
              />
              <Bar dataKey="totalMeters" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
