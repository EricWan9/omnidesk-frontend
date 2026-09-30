# OmniDesk Demo Landing Page

A static portfolio landing page for OmniDesk, a real-time customer support platform. It uses only semantic HTML, CSS and vanilla JavaScript. There is no npm project, framework, bundler or build step.

## Run locally

Open `index.html` directly, use VS Code Live Server, or run a local server from this folder:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Replace demo integration points

Update the clearly marked placeholders in `index.html`:

- Agent Console URL: replace `https://agent-test.omnidesk.team`.
- Customer widget: replace the widget preview block with the actual embed script. The source includes the comment `Replace this block with the actual OmniDesk widget embed script`.
- Widget fallback: if needed, use `https://widget-test.omnidesk.team/?widgetKey=REPLACE_ME` as the iframe source.
- Demo credentials: replace or remove the `Demo Agent` block. `REPLACE_ME` is intentionally not a real password.
- GitHub links: replace the `REPLACE_ME` owner in the backend, frontend and architecture URLs.
- Agent screenshot: add `assets/agent-console.png` and replace the styled placeholder in the Agent Workspace section.

## Deploy

The folder can be deployed directly to Azure Static Web Apps or any static web host. No build command is required. Configure the deployment output as the project root, where `index.html` is located.
