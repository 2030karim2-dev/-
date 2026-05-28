/**
 * Dashboard Stats API Layer
 * Split endpoints for stats, chart, and alerts with independent stale times
 */

import { dashboardApi } from './index';

export const getDateLimit = (days = 90) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
};

export const dashboardStatsApi = {
    async fetchStats(companyId: string, signal?: AbortSignal) {
        // TODO: Optimize to a lightweight RPC once backend supports mode-specific queries
        return dashboardApi.fetchRawDashboardData(companyId, getDateLimit(90), signal);
    },
    async fetchChartData(companyId: string, days = 30, signal?: AbortSignal) {
        return dashboardApi.fetchRawDashboardData(companyId, getDateLimit(days), signal);
    },
    async fetchAlerts(companyId: string, signal?: AbortSignal) {
        return dashboardApi.fetchRawDashboardData(companyId, getDateLimit(90), signal);
    }
};
