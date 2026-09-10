import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isTokenExpired } from "../auth/tokenUtils";

interface ProtectedRouteProps {
    children: ReactNode;
}

function ProtectedRoute({
    children,
}: ProtectedRouteProps) {
    const token =
        sessionStorage.getItem("accessToken");

    if (!token || isTokenExpired(token)) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;