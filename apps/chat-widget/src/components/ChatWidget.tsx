import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ApiError,
  getWidgetMessages,
  sendWidgetMessage,
  startWidgetConversation,
} from "../api/widgetApi";

import { widgetKey } from "../config";

import { createWidgetSignalRConnection }
  from "../realtime/widgetSignalR";

import {
  clearWidgetSession,
  getWidgetSession,
  saveWidgetSession,
} from "../session/widgetSession";

import {
    MessageSenderType,
  type Message,
  type WidgetSession,
} from "../types/widget";

import styles from "./ChatWidget.module.css";

type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

let sessionCreationPromise:
  Promise<WidgetSession> | null = null;

async function createSession():
  Promise<WidgetSession> {
  if (sessionCreationPromise) {
    return sessionCreationPromise;
  }

  sessionCreationPromise = (async () => {
    const result =
      await startWidgetConversation(widgetKey);

    const session: WidgetSession = {
      conversationId:
        result.conversationId,
      accessToken:
        result.accessToken,
    };

    saveWidgetSession(
      widgetKey,
      session,
    );

    return session;
  })();

  try {
    return await sessionCreationPromise;
  } finally {
    sessionCreationPromise = null;
  }
}

function appendUniqueMessage(
  messages: Message[],
  newMessage: Message,
): Message[] {
  const exists =
    messages.some(
      message =>
        message.id === newMessage.id,
    );

  if (exists) {
    return messages;
  }

  return [
    ...messages,
    newMessage,
  ];
}

function formatTime(
  dateValue: string,
): string {
  const date = new Date(dateValue);

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getSenderLabel(
  message: Message,
): string {
  switch (message.messageSender.type) {
    case MessageSenderType.Customer:
      return "You";

    case MessageSenderType.Agent:
      return "Support";

    case MessageSenderType.Ai:
      return "AI Assistant";

    case MessageSenderType.System:
      return "System";

    default:
      return "Support";
  }
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [session, setSession] =
    useState<WidgetSession | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [draft, setDraft] =
    useState("");

  const [isInitializing, setIsInitializing] =
    useState(false);

  const [isSending, setIsSending] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [
    connectionState,
    setConnectionState,
  ] =
    useState<ConnectionState>(
      "disconnected",
    );

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const initializedRef =
    useRef(false);

  useEffect(() => {
    if (
      !isOpen ||
      initializedRef.current
    ) {
      return;
    }

    initializedRef.current = true;

    let cancelled = false;

    async function initialize() {
      setIsInitializing(true);
      setError(null);

      try {
        let currentSession =
          getWidgetSession(widgetKey);

        if (!currentSession) {
          currentSession =
            await createSession();
        }

        let loadedMessages: Message[];

        try {
          loadedMessages =
            await getWidgetMessages(
              currentSession.conversationId,
              currentSession.accessToken,
            );
        } catch (err) {
          const sessionExpired =
            err instanceof ApiError &&
            (
              err.status === 401 ||
              err.status === 403
            );

          if (!sessionExpired) {
            throw err;
          }

          clearWidgetSession(widgetKey);

          currentSession =
            await createSession();

          loadedMessages =
            await getWidgetMessages(
              currentSession.conversationId,
              currentSession.accessToken,
            );
        }

        if (cancelled) {
          return;
        }

        setSession(currentSession);
        setMessages(loadedMessages);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to start chat.",
        );
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const connection =
      createWidgetSignalRConnection(
        session.accessToken,
      );

    let disposed = false;

    const handleMessage =
      (message: Message) => {
        setMessages(current =>
          appendUniqueMessage(
            current,
            message,
          ),
        );
      };

    connection.on(
      "MessageSent",
      handleMessage,
    );

    connection.onreconnecting(() => {
      if (!disposed) {
        setConnectionState(
          "reconnecting",
        );
      }
    });

    connection.onreconnected(
      async () => {
        if (disposed) {
          return;
        }

        try {
          await connection.invoke(
            "SubscribeConversation",
            session.conversationId,
          );

          setConnectionState(
            "connected",
          );
        } catch {
          setConnectionState(
            "disconnected",
          );
        }
      },
    );

    connection.onclose(() => {
      if (!disposed) {
        setConnectionState(
          "disconnected",
        );
      }
    });

    async function connect() {
      try {
        setConnectionState(
          "connecting",
        );

        await connection.start();

        if (disposed) {
          await connection.stop();
          return;
        }

        await connection.invoke(
          "SubscribeConversation",
          session.conversationId,
        );

        setConnectionState(
          "connected",
        );
      } catch (err) {
        if (!disposed) {
          console.error(
            "SignalR connection failed.",
            err,
          );

          setConnectionState(
            "disconnected",
          );
        }
      }
    }

    void connect();

    return () => {
      disposed = true;

      connection.off(
        "MessageSent",
        handleMessage,
      );

      void connection.stop();
    };
  }, [session]);

  useEffect(() => {
    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }, [messages]);

  async function handleSend() {
    const content =
      draft.trim();

    if (
      !content ||
      !session ||
      isSending
    ) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const message =
        await sendWidgetMessage(
          session.conversationId,
          session.accessToken,
          content,
        );

      setMessages(current =>
        appendUniqueMessage(
          current,
          message,
        ),
      );

      setDraft("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(
    event:
      React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void handleSend();
    }
  }

  const statusText =
    connectionState === "connected"
      ? "Online"
      : connectionState ===
          "reconnecting"
        ? "Reconnecting..."
        : connectionState ===
            "connecting"
          ? "Connecting..."
          : "Offline";

  return (
    <>
      {isOpen && (
        <section
          className={styles.widget}
          aria-label="Customer support chat"
        >
          <header
            className={styles.header}
          >
            <div
              className={
                styles.headerIdentity
              }
            >
              <div
                className={
                  styles.avatar
                }
              >
                O
              </div>

              <div>
                <h1
                  className={
                    styles.title
                  }
                >
                  OmniDesk Support
                </h1>

                <div
                  className={
                    styles.status
                  }
                >
                  <span
                    className={`${styles.statusDot} ${
                      connectionState ===
                      "connected"
                        ? styles.statusDotOnline
                        : ""
                    }`}
                  />

                  {statusText}
                </div>
              </div>
            </div>

            <button
              type="button"
              className={
                styles.closeButton
              }
              onClick={() =>
                setIsOpen(false)
              }
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          <main
            className={
              styles.messageArea
            }
          >
            {isInitializing ? (
              <div
                className={
                  styles.centerState
                }
              >
                <div
                  className={
                    styles.spinner
                  }
                />

                <span>
                  Starting chat...
                </span>
              </div>
            ) : messages.length === 0 ? (
              <div
                className={
                  styles.welcome
                }
              >
                <div
                  className={
                    styles.welcomeIcon
                  }
                >
                  👋
                </div>

                <h2>
                  How can we help?
                </h2>

                <p>
                  Send us a message and
                  our support team will
                  get back to you.
                </p>
              </div>
            ) : (
              <div
                className={
                  styles.messages
                }
              >
                {messages.map(
                  message => {
                    const isCustomer =
                      message.messageSender.type ===
                      MessageSenderType.Customer;

                    const isSystem =
                      message.messageSender.type ===
                      MessageSenderType.System;

                    if (isSystem) {
                      return (
                        <div
                          key={
                            message.id
                          }
                          className={
                            styles.systemMessage
                          }
                        >
                          {
                            message.content
                          }
                        </div>
                      );
                    }

                    return (
                      <article
                        key={
                          message.id
                        }
                        className={`${styles.messageRow} ${
                          isCustomer
                            ? styles.messageRowCustomer
                            : styles.messageRowOther
                        }`}
                      >
                        <div
                          className={`${styles.messageBubble} ${
                            isCustomer
                              ? styles.customerBubble
                              : styles.agentBubble
                          }`}
                        >
                          <div
                            className={
                              styles.messageSender
                            }
                          >
                            {getSenderLabel(
                              message,
                            )}
                          </div>

                          <div
                            className={
                              styles.messageContent
                            }
                          >
                            {
                              message.content
                            }
                          </div>

                          <time
                            className={
                              styles.messageTime
                            }
                          >
                            {formatTime(
                              message.createdAt,
                            )}
                          </time>
                        </div>
                      </article>
                    );
                  },
                )}

                <div
                  ref={
                    messagesEndRef
                  }
                />
              </div>
            )}
          </main>

          {error && (
            <div
              className={
                styles.errorBanner
              }
            >
              {error}
            </div>
          )}

          <footer
            className={
              styles.composer
            }
          >
            <textarea
              value={draft}
              onChange={event =>
                setDraft(
                  event.target.value,
                )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={
                !session ||
                isInitializing
              }
              rows={1}
              maxLength={2000}
              placeholder="Write a message..."
              className={
                styles.textarea
              }
              aria-label="Message"
            />

            <button
              type="button"
              className={
                styles.sendButton
              }
              disabled={
                !draft.trim() ||
                !session ||
                isSending
              }
              onClick={() =>
                void handleSend()
              }
              aria-label="Send message"
            >
              {isSending ? (
                <span
                  className={
                    styles.sendSpinner
                  }
                />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4L21 12L4 20L7 12L4 4Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          </footer>

          <div
            className={
              styles.footerBrand
            }
          >
            Powered by OmniDesk
          </div>
        </section>
      )}

      <button
        type="button"
        className={
          styles.launcher
        }
        onClick={() =>
          setIsOpen(current => !current)
        }
        aria-label={
          isOpen
            ? "Close support chat"
            : "Open support chat"
        }
      >
        {isOpen ? (
          <span
            className={
              styles.launcherClose
            }
          >
            ×
          </span>
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 5.75C5 4.78 5.78 4 6.75 4H17.25C18.22 4 19 4.78 19 5.75V13.25C19 14.22 18.22 15 17.25 15H10L6 19V15H6.75C5.78 15 5 14.22 5 13.25V5.75Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
    </>
  );
}