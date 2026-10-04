import { Hono } from "hono";
import { judge, spanQuestions, spanState, type Judged, type Span } from "./trace.ts";
import { NOT_RUNNING, predict, sidecarHealth } from "./laya.ts";

const PORT = 3015;

const seed = (await Bun.file(new URL("../seed-trace.json", import.meta.url)).json()) as { spans: Span[] };
let spans: Judged[] = seed.spans.map((span) => ({ ...span, label: null, abstained: false, error: null }));

const app = new Hono();
const page = await Bun.file(new URL("../public/index.html", import.meta.url)).text();

app.get("/", (c) => c.html(page));
app.get("/api/health", async (c) => {
  const health = await sidecarHealth();
  if (!health.loaded) return c.json({ loaded: false, error: NOT_RUNNING });
  return c.json({ loaded: true, error: null });
});
app.get("/api/trace", (c) => c.json({ spans }));

app.post("/api/compact", async (c) => {
  const next: Judged[] = [];
  let failed = false;
  for (const span of seed.spans) {
    if (failed) {
      next.push({ ...span, label: null, abstained: false, error: NOT_RUNNING });
      continue;
    }
    const result = await predict(spanState(span), spanQuestions());
    const judged = judge(span, result);
    if (judged.error === NOT_RUNNING) failed = true;
    next.push(judged);
  }
  spans = next;
  return c.json({ spans, error: failed ? NOT_RUNNING : null });
});

if (import.meta.main) {
  Bun.serve({ hostname: "127.0.0.1", port: PORT, fetch: app.fetch });
  console.log(`compact listening on http://127.0.0.1:${PORT}`);
}
