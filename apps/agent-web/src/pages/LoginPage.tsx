import {
    useState,
    type FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import { login } from "../api/authApi";
import { setAccessToken } from "../auth/tokenStore";

import styles from "./LoginPage.module.css";

function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setIsLoading(true);
        setError(null);

        try {
            const result = await login({
                email,
                password,
            });

            setAccessToken(
                result.accessToken
            );

            navigate("/workspace");
        }
        catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            }
            else {
                setError(
                    "An unexpected error occurred."
                );
            }
        }
        finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.backgroundAccent} />

            <main className={styles.container}>
                <div className={styles.brand}>
                    <div className={styles.brandMark}>
                        O
                    </div>

                    <div>
                        <div className={styles.brandName}>
                            OmniDesk
                        </div>

                        <div
                            className={
                                styles.brandDescription
                            }
                        >
                            Customer Support
                        </div>
                    </div>
                </div>

                <section className={styles.card}>
                    <div className={styles.heading}>
                        <h1>Welcome back</h1>

                        <p>
                            Sign in to your OmniDesk
                            workspace.
                        </p>
                    </div>

                    <form
                        className={styles.form}
                        onSubmit={handleSubmit}
                    >
                        <div
                            className={
                                styles.field
                            }
                        >
                            <label htmlFor="email">
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                                disabled={isLoading}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div
                            className={
                                styles.field
                            }
                        >
                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                value={password}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                                disabled={isLoading}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        {error && (
                            <div
                                className={
                                    styles.error
                                }
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            className={
                                styles.submitButton
                            }
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Signing in..."
                                : "Sign in"}
                        </button>
                    </form>
                </section>

                <p className={styles.footer}>
                    OmniDesk Agent Workspace
                </p>
            </main>
        </div>
    );
}

export default LoginPage;