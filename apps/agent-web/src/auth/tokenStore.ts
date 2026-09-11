export function getAccessToken(): string | null {
    return sessionStorage.getItem("accessToken");
}

export function setAccessToken(token: string): void {
    sessionStorage.setItem("accessToken", token);
}

export function clearAccessToken(): void {
    sessionStorage.removeItem("accessToken");
}