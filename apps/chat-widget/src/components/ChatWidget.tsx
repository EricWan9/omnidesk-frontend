import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getWidgetMessages,
  sendWidgetMessage,
  startWidgetConversation,
} from "../api/widgetApi";

import {
  createWidgetSignalRConnection,
} from "../realtime/widgetSignalR";

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

import {
  ApiError,
} from "../api/apiClient";

import MessageAttachments
  from "./MessageAttachments";

import styles
  from "./ChatWidget.module.css";


type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";


const MAX_FILE_COUNT = 5;

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_FILE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
  ]);


let sessionCreationPromise:
  Promise<WidgetSession> | null = null;


/*
 * Create a new anonymous widget session.
 *
 * widgetKey is runtime configuration.
 * It must come from the embedding customer's
 * widget instance, not from build-time config.
 */
async function createSession(
  widgetKey: string,
): Promise<WidgetSession> {

  if (sessionCreationPromise) {
    return sessionCreationPromise;
  }

  sessionCreationPromise =
    (async () => {

      const result =
        await startWidgetConversation(
          widgetKey,
        );

      const session:
        WidgetSession = {

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
  }
  finally {
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
        message.id ===
        newMessage.id,
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

  return new Date(
    dateValue,
  ).toLocaleTimeString(
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

  switch (
    message.messageSender.type
  ) {

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

  const [
    widgetKey,
  ] =
    useState<string | null>(
      () => {

        const params =
          new URLSearchParams(
            window.location.search,
          );

        const value =
          params
            .get("widgetKey")
            ?.trim();

        return value || null;
      },
    );

  if(widgetKey === null) {
    return;
  }
  
  const widgetKeySafe = widgetKey;


  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    session,
    setSession,
  ] =
    useState<
      WidgetSession | null
    >(null);

  const [
    messages,
    setMessages,
  ] =
    useState<Message[]>([]);

  const [
    draft,
    setDraft,
  ] =
    useState("");

  const [
    selectedFiles,
    setSelectedFiles,
  ] =
    useState<File[]>([]);

  const [
    fileError,
    setFileError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isInitializing,
    setIsInitializing,
  ] =
    useState(false);

  const [
    isSending,
    setIsSending,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    connectionState,
    setConnectionState,
  ] =
    useState<ConnectionState>(
      "disconnected",
    );


  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const initializedRef =
    useRef(false);


  /*
   * Initialize widget session
   */
  useEffect(() => {

    if (
      !isOpen ||
      initializedRef.current
    ) {
      return;
    }


    if (!widgetKey) {

      setError(
        "Widget key is missing.",
      );

      return;
    }


    initializedRef.current = true;

    let cancelled = false;


    async function initialize() {

      setIsInitializing(true);
      setError(null);

      try {

        let currentSession =
          getWidgetSession(
            widgetKeySafe,
          );


        if (!currentSession) {

          currentSession =
            await createSession(
              widgetKeySafe,
            );
        }


        let loadedMessages:
          Message[];


        try {

          loadedMessages =
            await getWidgetMessages(
              currentSession
                .conversationId,

              currentSession
                .accessToken,
            );
        }
        catch (err) {

          const sessionExpired =
            err instanceof ApiError &&
            (
              err.status === 401 ||
              err.status === 403
            );


          if (!sessionExpired) {
            throw err;
          }


          clearWidgetSession(
            widgetKeySafe,
          );


          currentSession =
            await createSession(
              widgetKeySafe,
            );


          loadedMessages =
            await getWidgetMessages(
              currentSession
                .conversationId,

              currentSession
                .accessToken,
            );
        }


        if (cancelled) {
          return;
        }


        setSession(
          currentSession,
        );

        setMessages(
          loadedMessages,
        );
      }
      catch (err) {

        if (cancelled) {
          return;
        }


        setError(
          err instanceof Error
            ? err.message
            : "Unable to start chat.",
        );
      }
      finally {

        if (!cancelled) {

          setIsInitializing(
            false,
          );
        }
      }
    }


    void initialize();


    return () => {
      cancelled = true;
    };

  }, [
    isOpen,
    widgetKey,
  ]);


  /*
   * SignalR
   */
  useEffect(() => {

    if (!session) {
      return;
    }


    /*
     * Capture the current session.
     *
     * This avoids nullable closure issues
     * after await / reconnect callbacks.
     */
    const currentSession =
      session;


    const connection =
      createWidgetSignalRConnection(
        currentSession.accessToken,
      );


    let disposed = false;


    const handleMessage =
      (message: Message) => {

        setMessages(
          current =>
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


    connection.onreconnecting(
      () => {

        if (!disposed) {

          setConnectionState(
            "reconnecting",
          );
        }
      },
    );


    connection.onreconnected(
      async () => {

        if (disposed) {
          return;
        }


        try {

          await connection.invoke(
            "SubscribeConversation",
            currentSession
              .conversationId,
          );


          setConnectionState(
            "connected",
          );
        }
        catch (err) {

          console.error(
            "Failed to resubscribe conversation.",
            err,
          );


          setConnectionState(
            "disconnected",
          );
        }
      },
    );


    connection.onclose(
      () => {

        if (!disposed) {

          setConnectionState(
            "disconnected",
          );
        }
      },
    );


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
          currentSession
            .conversationId,
        );


        setConnectionState(
          "connected",
        );
      }
      catch (err) {

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


  /*
   * Auto scroll
   */
  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });

  }, [messages]);


  /*
   * File selection
   */
  function handleFileChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {

    const incomingFiles =
      Array.from(
        event.target.files ?? [],
      );


    /*
     * Allow selecting the same
     * file again.
     */
    event.target.value = "";


    if (
      incomingFiles.length === 0
    ) {
      return;
    }


    const invalidType =
      incomingFiles.find(
        file =>
          !ALLOWED_FILE_TYPES
            .has(file.type),
      );


    if (invalidType) {

      setFileError(
        `Unsupported file type: ${invalidType.name}`,
      );

      return;
    }


    const tooLarge =
      incomingFiles.find(
        file =>
          file.size >
          MAX_FILE_SIZE,
      );


    if (tooLarge) {

      setFileError(
        `${tooLarge.name} exceeds 10 MB.`,
      );

      return;
    }


    const emptyFile =
      incomingFiles.find(
        file =>
          file.size <= 0,
      );


    if (emptyFile) {

      setFileError(
        `${emptyFile.name} is empty.`,
      );

      return;
    }


    setFileError(null);


    setSelectedFiles(
      current => {

        const combined = [
          ...current,
          ...incomingFiles,
        ];


        if (
          combined.length >
          MAX_FILE_COUNT
        ) {

          setFileError(
            "Maximum 5 attachments per message.",
          );
        }


        return combined.slice(
          0,
          MAX_FILE_COUNT,
        );
      },
    );
  }


  function removeSelectedFile(
    index: number,
  ) {

    setSelectedFiles(
      current =>
        current.filter(
          (_, currentIndex) =>
            currentIndex !== index,
        ),
    );


    setFileError(null);
  }


  /*
   * Send message
   */
  async function handleSend() {

    const content =
      draft.trim();


    if (
      (
        !content &&
        selectedFiles.length === 0
      ) ||
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
          selectedFiles,
        );


      setMessages(
        current =>
          appendUniqueMessage(
            current,
            message,
          ),
      );


      setDraft("");

      setSelectedFiles([]);

      setFileError(null);
    }
    catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message.",
      );
    }
    finally {

      setIsSending(false);
    }
  }


  /*
   * Enter sends.
   * Shift+Enter creates newline.
   */
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
          className={
            styles.widget
          }
          aria-label={
            "Customer support chat"
          }
        >

          {/* Header */}
          <header
            className={
              styles.header
            }
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
                    className={
                      `${styles.statusDot} ${
                        connectionState ===
                        "connected"
                          ? styles.statusDotOnline
                          : ""
                      }`
                    }
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
              aria-label={
                "Close chat"
              }
            >
              ×
            </button>
          </header>


          {/* Messages */}
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
                      message
                        .messageSender
                        .type ===
                      MessageSenderType
                        .Customer;


                    const isSystem =
                      message
                        .messageSender
                        .type ===
                      MessageSenderType
                        .System;


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
                        className={
                          `${styles.messageRow} ${
                            isCustomer
                              ? styles.messageRowCustomer
                              : styles.messageRowOther
                          }`
                        }
                      >

                        <div
                          className={
                            `${styles.messageBubble} ${
                              isCustomer
                                ? styles.customerBubble
                                : styles.agentBubble
                            }`
                          }
                        >

                          <div
                            className={
                              styles.messageSender
                            }
                          >
                            {
                              getSenderLabel(
                                message,
                              )
                            }
                          </div>


                          {message.content && (

                            <div
                              className={
                                styles.messageContent
                              }
                            >
                              {
                                message.content
                              }
                            </div>
                          )}


                          {session && (

                            <MessageAttachments
                              attachments={
                                message.attachments ??
                                []
                              }
                              accessToken={
                                session.accessToken
                              }
                            />
                          )}


                          <time
                            className={
                              styles.messageTime
                            }
                          >
                            {
                              formatTime(
                                message.createdAt,
                              )
                            }
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


          {/* General API error */}
          {error && (
            <div
              className={
                styles.errorBanner
              }
            >
              {error}
            </div>
          )}


          {/* File validation error */}
          {fileError && (
            <div
              className={
                styles.errorBanner
              }
            >
              {fileError}
            </div>
          )}


          {/* Files waiting to be sent */}
          {selectedFiles.length > 0 && (

            <div
              className={
                styles.selectedFiles
              }
            >

              {selectedFiles.map(
                (
                  file,
                  index,
                ) => (

                  <div
                    key={
                      `${file.name}-${file.size}-${index}`
                    }
                    className={
                      styles.selectedFile
                    }
                  >

                    <span
                      className={
                        styles.selectedFileName
                      }
                    >
                      {file.name}
                    </span>


                    <button
                      type="button"
                      disabled={
                        isSending
                      }
                      className={
                        styles.removeFileButton
                      }
                      onClick={() =>
                        removeSelectedFile(
                          index,
                        )
                      }
                      aria-label={
                        `Remove ${file.name}`
                      }
                    >
                      ×
                    </button>

                  </div>
                ),
              )}

            </div>
          )}


          {/* Composer */}
          <footer
            className={
              styles.composer
            }
          >

            <input
              ref={
                fileInputRef
              }
              type="file"
              multiple
              hidden
              disabled={
                !session ||
                isInitializing ||
                isSending
              }
              accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
              onChange={
                handleFileChange
              }
            />


            <button
              type="button"
              className={
                styles.attachButton
              }
              disabled={
                !session ||
                isInitializing ||
                isSending
              }
              onClick={() =>
                fileInputRef
                  .current
                  ?.click()
              }
              aria-label={
                "Attach files"
              }
            >
              📎
            </button>


            <textarea
              value={
                draft
              }
              onChange={
                event =>
                  setDraft(
                    event.target.value,
                  )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={
                !session ||
                isInitializing ||
                isSending
              }
              rows={
                1
              }
              maxLength={
                2000
              }
              placeholder={
                "Write a message..."
              }
              className={
                styles.textarea
              }
              aria-label={
                "Message"
              }
            />


            <button
              type="button"
              className={
                styles.sendButton
              }
              disabled={
                (
                  !draft.trim() &&
                  selectedFiles.length === 0
                ) ||
                !session ||
                isSending
              }
              onClick={() =>
                void handleSend()
              }
              aria-label={
                "Send message"
              }
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


      {/* Launcher */}
      <button
        type="button"
        className={
          styles.launcher
        }
        onClick={() =>
          setIsOpen(
            current =>
              !current,
          )
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