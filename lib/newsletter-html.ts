import { NextResponse } from 'next/server';

type Variant = 'success' | 'error' | 'info';

type RenderArgs = {
  title: string;
  heading: string;
  body: string; // plain text or inline HTML
  variant?: Variant;
  status?: number;
  extraBodyHtml?: string;
};

/**
 * Renders a standalone HTML page matching the Cadencea NI-inspired design system
 * (white canvas, black ink, blue accent). Used by newsletter confirm / unsubscribe
 * GET routes that return HTML directly rather than rendering a React page.
 */
export function renderNewsletterPage({
  title,
  heading,
  body,
  variant = 'info',
  status = 200,
  extraBodyHtml = '',
}: RenderArgs): NextResponse {
  const variantLabel =
    variant === 'success' ? 'Confirmed' : variant === 'error' ? 'Error' : 'Notice';
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>${escape(title)} — Cadencea</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --canvas: #FFFFFF;
        --elevated: #F5F5F5;
        --ink: #000000;
        --ink-muted: #555555;
        --ink-subtle: #888888;
        --line: #E0E0E0;
        --accent: #0066FF;
        --accent-hover: #0052CC;
        --price: #00A651;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: var(--canvas);
        color: var(--ink);
        font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        font-size: 16px;
        line-height: 1.6;
      }
      .page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
      }
      .card {
        width: 100%;
        max-width: 480px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--canvas);
        padding: 40px 32px;
      }
      .wordmark {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 32px;
        color: var(--ink);
        text-decoration: none;
      }
      .wordmark .mark {
        display: inline-block;
        width: 16px;
        height: 16px;
        background: var(--ink);
      }
      .wordmark .word {
        font-weight: 700;
        letter-spacing: -0.01em;
        font-size: 16px;
      }
      .eyebrow {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ink-subtle);
        margin: 0 0 12px;
      }
      h1 {
        font-size: 28px;
        line-height: 1.2;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin: 0 0 16px;
      }
      p {
        margin: 0 0 16px;
        color: var(--ink-muted);
      }
      p strong { color: var(--ink); font-weight: 600; }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 44px;
        padding: 0 24px;
        background: var(--accent);
        color: #FFFFFF;
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.02em;
        border-radius: 4px;
        text-decoration: none;
        margin-top: 16px;
      }
      .btn:hover { background: var(--accent-hover); }
      .btn.secondary {
        background: transparent;
        color: var(--ink);
        border: 1px solid var(--ink);
      }
      .btn.secondary:hover { background: var(--elevated); }
      .footnote {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--line);
        font-size: 12px;
        color: var(--ink-subtle);
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="card">
        <a href="/" class="wordmark" aria-label="Cadencea home">
          <span class="mark" aria-hidden="true"></span>
          <span class="word">CADENCEA</span>
        </a>
        <p class="eyebrow">${escape(variantLabel)}</p>
        <h1>${escape(heading)}</h1>
        <p>${body}</p>
        ${extraBodyHtml}
        <a href="/" class="btn secondary">Return to homepage</a>
      </div>
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
