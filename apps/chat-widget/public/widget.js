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
    iframe.style.width = "380px";
    iframe.style.height = "640px";
    iframe.style.border = "none";
    iframe.style.zIndex = "2147483647";

    document.body.appendChild(iframe);
})();