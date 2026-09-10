import { useState, type FormEvent } from "react";
import { login } from "../api/authApi";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const navigate = useNavigate();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setIsLoading(true);
        setError(null);

        try {
            const result = await login({
                email,
                password,
            });

            sessionStorage.setItem(
                "accessToken",
                result.accessToken
            );

            navigate("/workspace");
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div>
            <h1>OmniDesk</h1>
            <p>Sign in to your account</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">
                        Email
                    </label>

                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                    />
                </div>

                <div>
                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                    />
                </div>

                {error && (
                    <p>{error}</p>
                )}

                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                </button>
            </form>
        </div>
    );
}

export default LoginPage;