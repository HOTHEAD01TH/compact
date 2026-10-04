import { describe, expect, test } from "bun:test";
import { collapseDropped, judge, spanQuestions, type Span } from "./trace.ts";
import { NOT_RUNNING } from "./laya.ts";

const span: Span = { id: "s4", kind: "thought", name: "repeat", text: "Restate the same plan." };

describe("compact", () => {
  test("drop keeps the span text", () => {
    const judged = judge(span, {
      ok: true,
      model: "english",
      usage: null,
      routing: null,
      answers: { disposition: { type: "choice", choice: "drop", abstention: "passed", answer_confidence: 0.88 } },
    });
    const view = collapseDropped([judged]);
    expect(view).toHaveLength(1);
    expect(view[0]!.label).toBe("drop");
    expect(view[0]!.text).toBe(span.text);
  });

  test("abstain escalates and does not drop", () => {
    const judged = judge(span, {
      ok: true,
      model: "english",
      usage: null,
      routing: null,
      answers: { disposition: { type: "choice", choice: "drop", abstention: "abstained", low_confidence: true, answer_confidence: 0.4 } },
    });
    expect(judged.label).toBe("escalate");
    expect(judged.abstained).toBe(true);
  });

  test("sidecar down leaves the span unlabeled", () => {
    const judged = judge(span, { ok: false, error: NOT_RUNNING });
    expect(judged.label).toBeNull();
    expect(judged.error).toBe("Laya not running");
    expect(judged.text).toBe(span.text);
  });

  test("choices are only keep drop escalate", () => {
    expect(Object.keys(spanQuestions().disposition.criteria).sort()).toEqual(["drop", "escalate", "keep"]);
  });
});
