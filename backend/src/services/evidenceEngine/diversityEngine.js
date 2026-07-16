/**
 * Step 6: Source Diversity Engine
 * Evaluates the diversity profile of collected evidence (Category A to F)
 */

/**
 * Calculates evidence diversity metrics
 * @param {Array} evidenceList - List of collected evidence resources
 * @returns {Object} Diversity breakdown & score
 */
const calculateSourceDiversity = (evidenceList = []) => {
  const counts = {
    international: 0,
    national: 0,
    government: 0,
    academic: 0,
    factCheck: 0,
    independent: 0
  };

  if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
    return {
      counts,
      diversityScore: 0,
      explanation: 'No evidence collected. Diversity rating is zero.'
    };
  }

  evidenceList.forEach(item => {
    const category = item.category || '';
    const src = (item.source || '').toLowerCase();
    const url = (item.url || '').toLowerCase();

    if (category.includes('International')) {
      counts.international++;
    } else if (category.includes('Indian') || category.includes('National')) {
      counts.national++;
    } else if (category.includes('Official') || url.includes('gov') || url.includes('nic') || src.includes('pib')) {
      counts.government++;
    } else if (category.includes('Fact Check')) {
      counts.factCheck++;
    } else if (url.includes('edu') || url.includes('ac.in')) {
      counts.academic++;
    } else {
      counts.independent++;
    }
  });

  // Calculate diversity score: count number of unique channels containing at least 1 source
  const activeChannels = Object.values(counts).filter(c => c > 0).length;
  const totalChannels = Object.keys(counts).length;
  
  // Calculate percentage (e.g. 3 out of 6 channels = 50% diversity score)
  const diversityScore = Math.round((activeChannels / totalChannels) * 100);

  return {
    counts,
    diversityScore,
    explanation: `Evidence gathered across ${activeChannels} distinct channels (Diversity Index: ${diversityScore}%).`
  };
};

module.exports = {
  calculateSourceDiversity
};
