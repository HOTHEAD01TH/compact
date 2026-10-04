# compact

Proxy in front of a coding-agent trace. For each span, Laya makes a choice: keep, drop, or escalate. Dropped spans stay in the response and in the page; the UI collapses them until one click. They are not deleted. Abstain (`min_confidence`) escalates instead of dropping. The seed trace is `seed-trace.json`.

If the sidecar is down or the checkpoint is not loaded, spans stay unlabeled and the API and the page say `Laya not running`. No keep/drop score is invented.

The app runs with no MCP host. A tiny MCP-style description of the same decision, for a host you wire up yourself:

```json
{
  "name": "compact_span",
  "description": "Label one coding-agent trace span keep, drop, or escalate. Dropped spans stay in the trace, collapsed, not deleted.",
  "input": { "span": { "id": "string", "kind": "string", "name": "string", "text": "string" } }
}
```

## Run

```bash
python3 -m pip install laya
python3 sidecar.py
```

Sidecar: `127.0.0.1:4015`. `Router.predict` in-process. `LAYA_SERVE_BACKEND=laya` or the request is refused. The first predict downloads weights from `huggingface.co/convaiinnovations/laya`. Listening does not.

```bash
bun install && bun run start
```

UI: `http://127.0.0.1:3015`.

Abstention uses `min_confidence` (0.6). The app does not read `action.act_probability`.
