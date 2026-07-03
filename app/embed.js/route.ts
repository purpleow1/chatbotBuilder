import { NextResponse } from "next/server";

export const runtime = "edge";

const loaderScript = String.raw`
(function () {
  var script = document.currentScript;
  if (!script) return;

  var botId = script.getAttribute("data-bot-id");
  if (!botId) return;

  var baseUrl = new URL(script.src).origin;
  var existing = document.querySelector('[data-helpdock-widget="' + botId + '"]');
  if (existing) return;

  var root = document.createElement("div");
  root.setAttribute("data-helpdock-widget", botId);
  root.style.position = "fixed";
  root.style.zIndex = script.getAttribute("data-z-index") || "2147483000";
  root.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  var panel = document.createElement("iframe");
  panel.title = "HelpDock AI chat";
  panel.src = baseUrl + "/widget/" + encodeURIComponent(botId) + "?embed=1";
  panel.allow = "clipboard-write";
  panel.style.width = "min(390px, calc(100vw - 32px))";
  panel.style.height = "min(640px, calc(100vh - 112px))";
  panel.style.border = "0";
  panel.style.borderRadius = "14px";
  panel.style.boxShadow = "0 24px 70px rgba(15, 23, 42, 0.26)";
  panel.style.background = "transparent";
  panel.style.display = "none";

  var button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Open chat");
  button.style.width = "58px";
  button.style.height = "58px";
  button.style.borderRadius = "999px";
  button.style.border = "0";
  button.style.boxShadow = "0 14px 35px rgba(15, 23, 42, 0.24)";
  button.style.color = "#ffffff";
  button.style.cursor = "pointer";
  button.style.display = "grid";
  button.style.placeItems = "center";
  button.style.marginTop = "12px";
  button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path></svg>';

  root.appendChild(panel);
  root.appendChild(button);
  document.body.appendChild(root);

  function applyPosition(position) {
    root.style.right = "";
    root.style.left = "";
    root.style.bottom = "20px";

    if (position === "bottom-left") {
      root.style.left = "20px";
      root.style.alignItems = "flex-start";
    } else {
      root.style.right = "20px";
      root.style.alignItems = "flex-end";
    }

    root.style.display = "flex";
    root.style.flexDirection = "column";
  }

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    button.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    button.innerHTML = open
      ? '<svg aria-hidden="true" viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>'
      : '<svg aria-hidden="true" viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path></svg>';
  }

  applyPosition(script.getAttribute("data-position") || "bottom-right");
  button.style.background = script.getAttribute("data-primary-color") || "#2563eb";

  fetch(baseUrl + "/api/widget/" + encodeURIComponent(botId), { mode: "cors" })
    .then(function (response) {
      if (!response.ok) throw new Error("Widget unavailable");
      return response.json();
    })
    .then(function (payload) {
      var settings = payload && payload.widget && payload.widget.settings ? payload.widget.settings : {};
      if (settings.primaryColor) button.style.background = settings.primaryColor;
      if (settings.launcherPosition) applyPosition(settings.launcherPosition);
      if (settings.botDisplayName) panel.title = settings.botDisplayName + " chat";
    })
    .catch(function () {
      root.remove();
    });

  button.addEventListener("click", function () {
    setOpen(panel.style.display === "none");
  });
})();
`;

export function GET() {
  return new NextResponse(loaderScript, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
