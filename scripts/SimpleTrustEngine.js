/**
 * Constructed using a graph with the following form
 * {
 *  <PubKey>:[<PubKey>]
 * }
 * As well as an Identity sources.
 * Identity source: [<PubKey>]
 *
 * Parametrization
 * Transitivity - Number between 0 to 1, representing transitivity of an idea
 * Cutoff - Scores that are discarded
 */
class TrustEngine {
  constructor(sparseGraph, identitySources, transitivity, cutoff) {
    this.sparseGraph = sparseGraph;
    this.identitySources = identitySources;
    this.transitivity = transitivity;
    this.cutoff = cutoff;
  }

  _calcTrustScore(startKey, endKey, weight) {
    if (startKey === endKey) {
      return 1;
    } else if (!Object.keys(this.sparseGraph).includes(startKey)) {
      return 0;
    } else {
      let subBranches = this.sparseGraph[startKey].map(signee =>
        this._calcTrustScore(signee, endKey, this.transitivity)
      );

      return (
        weight * subBranches.reduce((total, current) => (total += current), 0)
      );
    }
  }

  calculateTrustScore(pubKey) {
    let sourcesScore = this.identitySources.map(source =>
      this._calcTrustScore(source, pubKey, 1)
    );
    return sourcesScore.reduce((total, current) => (total += current), 0);
  }
}
