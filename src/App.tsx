import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  Route,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import SolanaProvider from "./components/SolanaProvider";
import { TokenProvider } from "./context/TokenContext";
import Home from "./pages/Home";
import CreateToken from "./pages/CreateToken";
import Dashboard from "./pages/Dashboard";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./components/AdminDashboard"; // <-- Add this line
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateToken />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} /> {/* <-- Add this route */}
      <Route path="/docs" element={<Documentation />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  ),  {
    future: {
      // Only use supported flags
      v7_normalizeFormMethod: true
    }
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <SolanaProvider>
        <TokenProvider>
          <RouterProvider router={router} />
        </TokenProvider>
      </SolanaProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;