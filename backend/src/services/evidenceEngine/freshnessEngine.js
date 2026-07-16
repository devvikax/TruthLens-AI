/**
 * Freshness Engine
 * Evaluates publication timelines to compute decay factors and breaking news indicators.
 */

const evaluateFreshness = (evidenceList = []) => {
  if (!evidenceList || evidenceList.length === 0) {
    return {
      averageFreshness: 50,
      isBreakingNews: false,
      freshnessMultiplier: 1.0,
      description: 'No evidence records available to evaluate freshness.'
    };
  }

  let totalFreshness = 0;
  let breakingCount = 0;

  const now = new Date();

  evidenceList.forEach(item => {
    let score = 50; // default
    if (item.date) {
      try {
        const pubDate = new Date(item.date);
        const ageInHours = (now - pubDate) / (1000 * 60 * 60);
        
        if (ageInHours <= 24) {
          score = 100;
          breakingCount++;
        } else if (ageInHours <= 72) {
          score = 90;
        } else if (ageInHours <= 168) {
          score = 80; // under a week
        } else if (ageInHours <= 720) {
          score = 65; // under a month
        } else {
          score = 40; // older
        }
      } catch (err) {
        score = 50;
      }
    }
    totalFreshness += score;
  });

  const averageFreshness = Math.round(totalFreshness / evidenceList.length);
  const isBreakingNews = breakingCount >= 1;

  // Multiplier: fresh reports in breaking news slightly boost confidence
  let freshnessMultiplier = 1.0;
  if (isBreakingNews) {
    freshnessMultiplier = 1.05;
  } else if (averageFreshness < 45) {
    freshnessMultiplier = 0.90; // penalize stale content
  }

  return {
    averageFreshness,
    isBreakingNews,
    freshnessMultiplier,
    description: isBreakingNews 
      ? 'Breaking news signals active. Evidentiary records represent real-time updates.' 
      : `Evidentiary records reflect typical archived coverage (Average Freshness: ${averageFreshness}%).`
  };
};

module.exports = {
  evaluateFreshness
};
