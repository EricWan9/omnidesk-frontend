(() => {
    const script = document.currentScript;

    if (!script) {
        return;
    }

    const widgetKey =
        script.getAttribute("data-widget-key");

    if (!widgetKey) {
        console.error(
            "OmniDesk: data-widget-key is required."
        );

        return;
    }

    const widgetOrigin =
        new URL(script.src).origin;

    const iframe =
        document.createElement("iframe");

    iframe.src =
        `${widgetOrigin}/?widgetKey=${encodeURIComponent(widgetKey)}`;

    iframe.title = "OmniDesk Chat";

    iframe.style.position = "fixed";
    iframe.style.right = "20px";
    iframe.style.bottom = "20px";
    iframe.style.width = "70px";
    iframe.style.height = "70px";
    iframe.style.border = "none";
    iframe.style.background = "transparent";
    iframe.style.zIndex = "2147483647";

    window.addEventListener("message", (event) => {
        if (
            event.source !== iframe.contentWindow ||
            event.origin !== widgetOrigin ||
            event.data?.type !== "omnidesk-widget-state" ||
            typeof event.data.isOpen !== "boolean"
        ) {
            return;
        }

        iframe.style.width = event.data.isOpen
            ? "380px"
            : "70px";
        iframe.style.height = event.data.isOpen
            ? "640px"
            : "70px";
    });

    document.body.appendChild(iframe);
})();