/**
 * Keep, drop, or escalate one span. Dropped spans stay in the trace.
 * Abstain escalates rather than dropping. A down model leaves the span unlabeled.
 */
import { passed, type LayaResult, NOT_RUNNING } from "./laya.ts";

export { NOT_RUNNING };

export type Span = { id: string; kind: string; name: string; text: string };

export type Label = "keep" | "drop" | "escalate";

export type Judged = Span & {
  label: Label | null;
  abstained: boolean;
  error: string | null;
};

export function spanQuestions() {
  return {
    disposition: {
      type: "choice" as const,
      instructions: "What should a trace viewer do with this span?",
      criteria: {
        keep: "the span is needed to follow the work",
        drop: "the span adds nothing and can be collapsed",
        escalate: "a person should look at this span",
      },
    },
  };
}

export function spanState(span: Span) {
  return { id: span.id, kind: span.kind, name: span.name, text: span.text };
}

export function judge(span: Span, result: LayaResult): Judged {
  if (!result.ok) {
    return { ...span, label: null, abstained: false, error: result.error === NOT_RUNNING ? NOT_RUNNING : result.error };
  }
  const answer = result.answers.disposition;
  if (!answer || answer.type !== "choice" || typeof answer.choice !== "string" || !passed(answer)) {
    return { ...span, label: "escalate", abstained: true, error: null };
  }
  if (answer.choice === "keep" || answer.choice === "drop" || answer.choice === "escalate") {
    return { ...span, label: answer.choice, abstained: false, error: null };
  }
  return { ...span, label: "escalate", abstained: true, error: null };
}

/** Presentation only. Dropped spans remain in the array with their text. */
export function collapseDropped(spans: Judged[]): Judged[] {
  return spans.map((span) => ({ ...span, text: span.text }));
}
