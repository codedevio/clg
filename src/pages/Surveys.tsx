import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardList, Plus, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Surveys = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Surveys</h1>
            <p className="text-muted-foreground mt-1">Create and manage your surveys</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/surveys/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Survey
            </Link>
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search surveys..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Empty State */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <ClipboardList className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2">No surveys yet</CardTitle>
            <CardDescription className="max-w-sm mb-6">
              Create your first survey to gather feedback and insights from your audience.
            </CardDescription>
            <Button asChild>
              <Link to="/dashboard/surveys/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Survey
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Surveys;
