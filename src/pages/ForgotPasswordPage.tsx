import { Navigate } from "react-router-dom";

// Kept as an alias so existing links keep working.
// All auth (sign in / sign up / forgot password) lives on a single screen.
const ForgotPasswordPage = () => <Navigate to="/auth?mode=forgot" replace />;

export default ForgotPasswordPage;
