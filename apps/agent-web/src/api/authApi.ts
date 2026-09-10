import type { LoginRequest, LoginResponse } from "../types/auth";

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(
        "/api/auth/login",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify(request),
        }
    );

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Invalid email or password.");
        }

        throw new Error("Login failed.");
    }

    const data: LoginResponse = await response.json();

    return data;
}