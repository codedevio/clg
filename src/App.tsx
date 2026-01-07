import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Quizzes from "./pages/Quizzes";
import QuizBuilder from "./pages/QuizBuilder";
import QuizEdit from "./pages/QuizEdit";
import QuizResults from "./pages/QuizResults";
import AdminAttemptReview from "./pages/AdminAttemptReview";
import Surveys from "./pages/Surveys";
import SurveyBuilder from "./pages/SurveyBuilder";
import SurveyEdit from "./pages/SurveyEdit";
import SurveyResults from "./pages/SurveyResults";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import TakeQuiz from "./pages/TakeQuiz";
import TakeSurvey from "./pages/TakeSurvey";
import QuizAttemptResult from "./pages/QuizAttemptResult";
import SuperAdminPanel from "./pages/SuperAdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/quiz/:quizId" element={<TakeQuiz />} />
            <Route path="/quiz/result/:attemptId" element={<QuizAttemptResult />} />
            <Route path="/survey/:surveyId" element={<TakeSurvey />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><SuperAdminPanel /></ProtectedRoute>} />
            <Route path="/dashboard/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
            <Route path="/dashboard/quizzes/new" element={<ProtectedRoute><QuizBuilder /></ProtectedRoute>} />
            <Route path="/dashboard/quizzes/:quizId/edit" element={<ProtectedRoute><QuizEdit /></ProtectedRoute>} />
            <Route path="/dashboard/quizzes/:quizId/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
            <Route path="/dashboard/quizzes/attempt/:attemptId/review" element={<ProtectedRoute><AdminAttemptReview /></ProtectedRoute>} />
            <Route path="/dashboard/surveys" element={<ProtectedRoute><Surveys /></ProtectedRoute>} />
            <Route path="/dashboard/surveys/new" element={<ProtectedRoute><SurveyBuilder /></ProtectedRoute>} />
            <Route path="/dashboard/surveys/:surveyId/edit" element={<ProtectedRoute><SurveyEdit /></ProtectedRoute>} />
            <Route path="/dashboard/surveys/:surveyId/results" element={<ProtectedRoute><SurveyResults /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
