import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    exp?: number;
}

export function isTokenExpired(
    token: string
): boolean {
    try {
        const payload =
            jwtDecode<JwtPayload>(token);

        if (!payload.exp) {
            return true;
        }

        return payload.exp <= Date.now() / 1000;
    } catch {
        return true;
    }
}