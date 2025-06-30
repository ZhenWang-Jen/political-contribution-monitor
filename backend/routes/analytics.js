// =============================================================================
// /api/analytics Route
// =============================================================================
// Provides aggregated analytics data for the entire dataset.

import express from 'express';
import moment from 'moment';

export default function createAnalyticsRouter(contributions) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      // 1. Summary Stats
      const totalContributions = contributions.length;
      const totalAmount = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const uniqueContributors = new Set(contributions.map(c => c.name)).size;
      const averageAmount = totalContributions > 0 ? totalAmount / totalContributions : 0;

      // 2. Monthly Contribution Trends
      const monthlyTrends = {};
      contributions.forEach(c => {
        if (c.date && c.date.length === 8) {
          const month = moment(c.date, 'MMDDYYYY').format('YYYY-MM');
          if (!monthlyTrends[month]) {
            monthlyTrends[month] = { count: 0, amount: 0 };
          }
          monthlyTrends[month].count++;
          monthlyTrends[month].amount += c.amount || 0;
        }
      });
      const timeSeries = Object.keys(monthlyTrends).sort().map(month => ({
        month,
        ...monthlyTrends[month]
      }));
      
      const lastMonth = timeSeries[timeSeries.length - 1];
      const secondLastMonth = timeSeries[timeSeries.length - 2];
      const monthlyTrend = secondLastMonth ? ((lastMonth.amount - secondLastMonth.amount) / secondLastMonth.amount) * 100 : 100;

      // 3. Geographic Distribution
      const geoDist = {};
      contributions.forEach(c => {
        const state = c.state || 'Unknown';
        if (!geoDist[state]) {
          geoDist[state] = { count: 0, amount: 0 };
        }
        geoDist[state].count++;
        geoDist[state].amount += c.amount || 0;
      });
      const geographicDistribution = Object.keys(geoDist).map(state => ({
        state,
        ...geoDist[state]
      }));

      // 4. Risk Analysis
      const contributorStats = {};
      contributions.forEach(c => {
        if (!contributorStats[c.name]) {
          contributorStats[c.name] = { totalAmount: 0, count: 0 };
        }
        contributorStats[c.name].totalAmount += c.amount || 0;
        contributorStats[c.name].count++;
      });

      let highRisk = 0, mediumRisk = 0, lowRisk = 0;
      Object.values(contributorStats).forEach(stats => {
        const avg = stats.count > 0 ? stats.totalAmount / stats.count : 0;
        if (avg > 5000) highRisk++;
        else if (avg > 1000) mediumRisk++;
        else lowRisk++;
      });
      const riskAnalysis = { highRisk, mediumRisk, lowRisk };

      // 5. Top Contributions
      const topContributions = [...contributions]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      res.json({
        summary: {
          monthlyTrend,
          activeContributors: uniqueContributors,
          highRisk,
          avgContribution: averageAmount,
        },
        monthlyTrends: timeSeries,
        geographicDistribution,
        riskAnalysis,
        topContributions
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Analytics failed' });
    }
  });

  return router;
} 