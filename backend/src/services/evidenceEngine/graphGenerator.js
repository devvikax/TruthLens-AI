/**
 * Claim Relationship Graph Generator
 * Creates a structured node-link graph mapping the claim verification trace.
 * Nodes: Claims, Evidence Snippets, Publishers, Original Sources, Verdict Node
 * Links: supports, contradicts, published_by, syndicated_from, concludes
 */

const generateClaimGraph = (claims = [], evidenceList = [], verdict = '') => {
  const nodes = [];
  const links = [];
  const registeredIds = new Set();

  // Helper to add unique nodes
  const addNode = (id, label, type, properties = {}) => {
    if (!registeredIds.has(id)) {
      registeredIds.add(id);
      nodes.push({ id, label, type, ...properties });
    }
  };

  // Helper to add links
  const addLink = (source, target, relationship, color = 'var(--border-color)') => {
    links.push({ source, target, relationship, color });
  };

  // 1. Add Verdict Node
  const verdictId = 'node_verdict';
  addNode(verdictId, `Verdict: ${verdict}`, 'verdict', {
    color: verdict.includes('True') ? 'var(--color-success)' : verdict.includes('Fake') ? 'var(--color-danger)' : 'var(--color-warning)',
    size: 25
  });

  // 2. Add Claim Nodes
  claims.forEach((c) => {
    const claimNodeId = `node_${c.id}`;
    addNode(claimNodeId, c.normalizedSentence, 'claim', {
      color: 'var(--color-primary)',
      size: 20
    });
    
    // Link Claim to Verdict
    addLink(claimNodeId, verdictId, 'concludes', 'var(--color-primary)');
  });

  // 3. Add Evidence, Publisher, and Wire Agency Nodes
  evidenceList.forEach((ev, idx) => {
    const evNodeId = `evidence_${idx}`;
    const cleanTitle = ev.title.length > 40 ? ev.title.substring(0, 40) + '...' : ev.title;
    
    // Add Evidence Node
    addNode(evNodeId, cleanTitle, 'evidence', {
      snippet: ev.snippet,
      url: ev.url,
      color: 'var(--text-secondary)',
      size: 15
    });

    // Map evidence back to its matching claim (heuristically, e.g. mapping index or default to first claim)
    const matchingClaim = claims[0] ? `node_${claims[0].id}` : '';
    if (matchingClaim) {
      const isDebunk = ev.category.includes('Fact Check') && (ev.snippet.toLowerCase().includes('false') || ev.snippet.toLowerCase().includes('debunked'));
      addLink(evNodeId, matchingClaim, isDebunk ? 'contradicts' : 'supports', isDebunk ? 'var(--color-danger)' : 'var(--color-success)');
    }

    // Add Publisher Node
    const pubId = `pub_${ev.source.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    addNode(pubId, ev.source, 'publisher', {
      reliability: ev.reliabilityScore,
      isOfficial: ev.isOfficial,
      color: ev.isOfficial ? 'var(--color-success)' : 'var(--border-focus)',
      size: 14
    });
    addLink(evNodeId, pubId, 'published_by', 'var(--border-color)');

    // Add Wire / Original Reporter Node (if syndication detected)
    if (ev.primarySource && !ev.primarySource.isOriginal) {
      const wireName = ev.primarySource.originalReporter;
      const wireId = `wire_${wireName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      
      addNode(wireId, wireName, 'wire_agency', {
        color: 'var(--color-success)',
        size: 16
      });
      addLink(pubId, wireId, 'syndicated_from', 'rgba(16, 185, 129, 0.4)');
    }
  });

  return {
    nodes,
    links
  };
};

module.exports = {
  generateClaimGraph
};
