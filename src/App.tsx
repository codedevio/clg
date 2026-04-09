import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PrivilegedRoute from "@/components/PrivilegedRoute";
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
import StudentMyResults from "./pages/StudentMyResults";
import SuperAdminPanel from "./pages/SuperAdminPanel";
import Documentation from "./pages/Documentation";
import HelpCenter from "./pages/HelpCenter";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
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
            <Route path="/auth/reset-password" element={<Auth />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/quiz/:quizId" element={<TakeQuiz />} />
            <Route path="/quiz/result/:attemptId" element={<QuizAttemptResult />} />
            <Route path="/survey/:surveyId" element={<TakeSurvey />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/my-results" element={<ProtectedRoute><StudentMyResults /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><PrivilegedRoute><SuperAdminPanel /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/quizzes" element={<ProtectedRoute><PrivilegedRoute><Quizzes /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/quizzes/new" element={<ProtectedRoute><PrivilegedRoute><QuizBuilder /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/quizzes/:quizId/edit" element={<ProtectedRoute><PrivilegedRoute><QuizEdit /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/quizzes/:quizId/results" element={<ProtectedRoute><PrivilegedRoute><QuizResults /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/quizzes/attempt/:attemptId/review" element={<ProtectedRoute><PrivilegedRoute><AdminAttemptReview /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/surveys" element={<ProtectedRoute><PrivilegedRoute><Surveys /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/surveys/new" element={<ProtectedRoute><PrivilegedRoute><SurveyBuilder /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/surveys/:surveyId/edit" element={<ProtectedRoute><PrivilegedRoute><SurveyEdit /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/surveys/:surveyId/results" element={<ProtectedRoute><PrivilegedRoute><SurveyResults /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><PrivilegedRoute><Analytics /></PrivilegedRoute></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
