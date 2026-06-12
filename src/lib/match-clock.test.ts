import assert from "node:assert/strict";
import test from "node:test";
import { getTimedMatchState } from "@/lib/match-clock";

const kickoff = "2026-06-12T02:00:00.000Z";

test("keeps a match upcoming before kickoff", () => {
  assert.deepEqual(
    getTimedMatchState(
      kickoff,
      "UPCOMING",
      undefined,
      new Date("2026-06-12T01:59:00.000Z"),
    ),
    { status: "UPCOMING", elapsed: undefined },
  );
});

test("moves a scheduled match to live and calculates match time", () => {
  assert.deepEqual(
    getTimedMatchState(
      kickoff,
      "UPCOMING",
      undefined,
      new Date("2026-06-12T02:20:00.000Z"),
    ),
    { status: "LIVE", elapsed: 20 },
  );
});

test("accounts for half time in the displayed match minute", () => {
  assert.deepEqual(
    getTimedMatchState(
      kickoff,
      "UPCOMING",
      undefined,
      new Date("2026-06-12T02:50:00.000Z"),
    ),
    { status: "LIVE", elapsed: 45 },
  );
});

test("moves a match past the live window to finished", () => {
  assert.deepEqual(
    getTimedMatchState(
      kickoff,
      "UPCOMING",
      undefined,
      new Date("2026-06-12T04:15:00.000Z"),
    ),
    { status: "FINISHED", elapsed: undefined },
  );
});

test("does not override an authoritative finished status", () => {
  assert.deepEqual(
    getTimedMatchState(
      kickoff,
      "FINISHED",
      90,
      new Date("2026-06-12T01:00:00.000Z"),
    ),
    { status: "FINISHED", elapsed: 90 },
  );
});
