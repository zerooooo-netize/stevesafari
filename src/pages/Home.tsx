import { useAuth } from "@/contexts/AuthContext";
import Index from "./Index";
import Resume from "./Resume";

/**
 * Root landing:
 * - Guests → marketing homepage (Index)
 * - Logged-in users → Resume (auto-redirects to next step)
 */
const Home = () =>{
 const { user, isLoading } = useAuth();
 if (isLoading) return<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading…</div></div>;
 return user ?<Resume />:<Index />;
};

export default Home;
