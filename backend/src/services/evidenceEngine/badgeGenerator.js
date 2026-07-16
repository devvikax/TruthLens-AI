/**
 * Step 14: Reliability Badges Generator
 * Yields appropriate visual tags based on source analysis profiles
 */

const generateBadges = (data) => {
  const {
    officialCount = 0,
    supportingCount = 0,
    contradictingCount = 0,
    factCheckCount = 0,
    internationalCount = 0,
    verdict = ''
  } = data;

  const badges = [];

  // 1. Debunked
  if (verdict.includes('Fake')) {
    badges.push({ text: 'Debunked', type: 'danger' });
  }

  // 2. Officially Verified
  if (officialCount > 0 && verdict.includes('True')) {
    badges.push({ text: 'Officially Verified', type: 'success' });
  }

  // 3. Government Source
  if (officialCount > 0) {
    badges.push({ text: 'Government Source', type: 'info' });
  }

  // 4. Fact Check Match
  if (factCheckCount > 0) {
    badges.push({ text: 'Fact Check Match', type: 'success' });
  }

  // 5. Multiple Trusted Sources
  if (supportingCount >= 3) {
    badges.push({ text: 'Multiple Trusted Sources', type: 'success' });
  }

  // 6. Conflicting Reports
  if (contradictingCount > 0) {
    badges.push({ text: 'Conflicting Reports', type: 'warning' });
  }

  // 7. International Coverage
  if (internationalCount > 0) {
    badges.push({ text: 'International Coverage', type: 'info' });
  }

  // Fallback badge if empty
  if (badges.length === 0) {
    badges.push({ text: 'Baseline Audited', type: 'neutral' });
  }

  return badges;
};

module.exports = {
  generateBadges
};
