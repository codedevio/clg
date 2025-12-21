import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

const Analytics = () => {
  const metrics = [
    { label: 'Total Attempts', value: '0', change: '+0%', icon: Users },
    { label: 'Avg. Score', value: '0%', change: '+0%', icon: TrendingUp },
    { label: 'Completion Rate', value: '0%', change: '+0%', icon: BarChart3 },
    { label: 'Avg. Duration', value: '0m', change: '+0%', icon: Clock },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance and insights across your quizzes and surveys
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-accent font-medium">{metric.change}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Response Trends</CardTitle>
              <CardDescription>Quiz and survey responses over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data available yet</p>
                  <p className="text-sm">Create quizzes or surveys to see analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Performance breakdown across quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data available yet</p>
                  <p className="text-sm">Complete quiz attempts to see score distribution</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
