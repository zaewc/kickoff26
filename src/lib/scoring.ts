export const EXACT_SCORE_POOL_PERCENT = 70;
export const OUTCOME_POOL_PERCENT = 30;

export function matchOutcome(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) return "DRAW";
  return homeScore > awayScore ? "HOME" : "AWAY";
}

export type PoolPrediction = {
  id: string;
  homeScore: number;
  awayScore: number;
  wagerPoints: number;
};

type Winner = PoolPrediction & {
  exactScore: boolean;
  outcomeCorrect: boolean;
};

function allocateByWager(pool: number, winners: Winner[]) {
  if (!winners.length || pool <= 0) return new Map<string, number>();

  const totalWager = winners.reduce(
    (sum, winner) => sum + winner.wagerPoints,
    0,
  );
  const shares = winners.map((winner) => {
    const raw = (pool * winner.wagerPoints) / totalWager;
    return {
      id: winner.id,
      points: Math.floor(raw),
      remainder: raw - Math.floor(raw),
    };
  });
  let remaining = pool - shares.reduce((sum, share) => sum + share.points, 0);

  shares
    .sort((a, b) => b.remainder - a.remainder || a.id.localeCompare(b.id))
    .forEach((share) => {
      if (remaining <= 0) return;
      share.points += 1;
      remaining -= 1;
    });

  return new Map(shares.map((share) => [share.id, share.points]));
}

export function settleBettingPool(
  predictions: PoolPrediction[],
  actualHome: number,
  actualAway: number,
) {
  const evaluated: Winner[] = predictions.map((prediction) => {
    const exactScore =
      prediction.homeScore === actualHome &&
      prediction.awayScore === actualAway;
    return {
      ...prediction,
      exactScore,
      outcomeCorrect:
        matchOutcome(prediction.homeScore, prediction.awayScore) ===
        matchOutcome(actualHome, actualAway),
    };
  });
  const totalPool = evaluated.reduce(
    (sum, prediction) => sum + prediction.wagerPoints,
    0,
  );
  const exactWinners = evaluated.filter((prediction) => prediction.exactScore);
  const outcomeWinners = evaluated.filter(
    (prediction) => prediction.outcomeCorrect && !prediction.exactScore,
  );

  if (!exactWinners.length && !outcomeWinners.length) {
    return evaluated.map((prediction) => ({
      ...prediction,
      payoutPoints: prediction.wagerPoints,
      refunded: true,
    }));
  }

  let exactPool = 0;
  let outcomePool = 0;
  if (exactWinners.length && outcomeWinners.length) {
    exactPool = Math.floor((totalPool * EXACT_SCORE_POOL_PERCENT) / 100);
    outcomePool = totalPool - exactPool;
  } else if (exactWinners.length) {
    exactPool = totalPool;
  } else {
    outcomePool = totalPool;
  }

  const exactAwards = allocateByWager(exactPool, exactWinners);
  const outcomeAwards = allocateByWager(outcomePool, outcomeWinners);

  return evaluated.map((prediction) => ({
    ...prediction,
    payoutPoints:
      exactAwards.get(prediction.id) ?? outcomeAwards.get(prediction.id) ?? 0,
    refunded: false,
  }));
}
