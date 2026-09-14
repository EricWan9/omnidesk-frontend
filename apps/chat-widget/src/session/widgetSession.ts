import type { WidgetSession } from "../types/widget";

function getSessionKey(widgetKey: string): string {
  return `omnidesk_widget_session:${widgetKey}`;
}

export function getWidgetSession(
  widgetKey: string,
): WidgetSession | null {
  const raw = sessionStorage.getItem(
    getSessionKey(widgetKey),
  );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as WidgetSession;
  } catch {
    sessionStorage.removeItem(
      getSessionKey(widgetKey),
    );

    return null;
  }
}

export function saveWidgetSession(
  widgetKey: string,
  session: WidgetSession,
): void {
  sessionStorage.setItem(
    getSessionKey(widgetKey),
    JSON.stringify(session),
  );
}

export function clearWidgetSession(
  widgetKey: string,
): void {
  sessionStorage.removeItem(
    getSessionKey(widgetKey),
  );
}