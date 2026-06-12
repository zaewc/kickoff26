import assert from "node:assert/strict";
import test from "node:test";
import {
  EXACT_SCORE_POOL_PERCENT,
  OUTCOME_POOL_PERCENT,
  matchOutcome,
  settleBettingPool,
} from "@/lib/scoring";

test("matchOutcome classifies home, draw, and away results", () => {
  assert.equal(matchOutcome(2, 1), "HOME");
  assert.equal(matchOutcome(1, 1), "DRAW");
  assert.equal(matchOutcome(0, 2), "AWAY");
});

test("splits the pool between exact and outcome winners", () => {
  const result = settleBettingPool(
    [
      { id: "exact", homeScore: 2, awayScore: 1, wagerPoints: 100 },
      { id: "outcome", homeScore: 1, awayScore: 0, wagerPoints: 100 },
      { id: "wrong", homeScore: 0, awayScore: 1, wagerPoints: 100 },
    ],
    2,
    1,
  );

  assert.equal(result.find((entry) => entry.id === "exact")?.payoutPoints, 210);
  assert.equal(result.find((entry) => entry.id === "outcome")?.payoutPoints, 90);
  assert.equal(result.find((entry) => entry.id === "wrong")?.payoutPoints, 0);
  assert.equal(EXACT_SCORE_POOL_PERCENT, 70);
  assert.equal(OUTCOME_POOL_PERCENT, 30);
});

test("distributes each winner group proportionally to wager", () => {
  const result = settleBettingPool(
    [
      { id: "a", homeScore: 2, awayScore: 0, wagerPoints: 100 },
      { id: "b", homeScore: 3, awayScore: 0, wagerPoints: 300 },
      { id: "wrong", homeScore: 0, awayScore: 1, wagerPoints: 100 },
    ],
    1,
    0,
  );

  assert.equal(result.find((entry) => entry.id === "a")?.payoutPoints, 125);
  assert.equal(result.find((entry) => entry.id === "b")?.payoutPoints, 375);
  assert.equal(
    result.reduce((sum, entry) => sum + entry.payoutPoints, 0),
    500,
  );
});

test("moves the full pool to the remaining winner group", () => {
  const result = settleBettingPool(
    [
      { id: "exact", homeScore: 1, awayScore: 1, wagerPoints: 100 },
      { id: "wrong", homeScore: 0, awayScore: 1, wagerPoints: 200 },
    ],
    1,
    1,
  );

  assert.equal(result.find((entry) => entry.id === "exact")?.payoutPoints, 300);
});

test("refunds every wager when nobody predicts the outcome", () => {
  const result = settleBettingPool(
    [
      { id: "a", homeScore: 0, awayScore: 1, wagerPoints: 120 },
      { id: "b", homeScore: 0, awayScore: 2, wagerPoints: 80 },
    ],
    2,
    0,
  );

  assert.deepEqual(
    result.map((entry) => [entry.id, entry.payoutPoints, entry.refunded]),
    [
      ["a", 120, true],
      ["b", 80, true],
    ],
  );
});
