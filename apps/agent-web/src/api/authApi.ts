import type {
    LoginRequest,
    LoginResponse,
} from "../types/auth";

import {
    apiFetch,
    ApiError,
} from "./apiClient";

export async function login(
    request: LoginRequest
): Promise<LoginResponse> {
    try {
        return await apiFetch<LoginResponse>(
            "/auth/login",
            {
                method: "POST",
                body: JSON.stringify(request),
            }
        );
    }
    catch (error) {
        if (
            error instanceof ApiError &&
            error.status === 401
        ) {
            throw new Error(
                "Invalid email or password."
            );
        }

        throw new Error(
            "Login failed."
        );
    }
}