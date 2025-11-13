import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { useToast } from '../../../contexts/ToastContext';
import AnalyticsService from '../../../api/services/analytics.service';
import UserService from '../../../api/services/user.service';
import SurveyService from '../../../api/services/survey.service';
import StatCard from '../../../components/UI/StatCard';
import ChartCard from '../../../components/UI/ChartCard';
import Loader from '../../../components/common/Loader/Loader';
import styles from './AdminDashboard.module.scss';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0
  });
  const [roleStats, setRoleStats] = useState({
    admin: 0,
    creator: 0,
    user: 0
  });
  const [surveyActivity, setSurveyActivity] = useState({
    labels: [],
    data: []
  });
  const [responsesPerSurvey, setResponsesPerSurvey] = useState({
    labels: [],
    data: []
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [dashboardSummary, roleStatsData, activityTrend] = await Promise.all([
        AnalyticsService.getDashboardStats().catch(() => ({ data: null })),
        UserService.getRoleStats().catch(() => ({ data: null })),
        AnalyticsService.getSurveyActivityTrend().catch(() => ({ data: null }))
      ]);

      // Process dashboard summary
      if (dashboardSummary.data) {
        setStats({
          totalUsers: dashboardSummary.data.totalUsers || 0,
          totalSurveys: dashboardSummary.data.totalSurveys || 0,
          totalResponses: dashboardSummary.data.totalResponses || 0,
          activeSurveys: dashboardSummary.data.activeSurveys || 0
        });
      }

      // Process role stats
      if (roleStatsData.data) {
        setRoleStats({
          admin: roleStatsData.data.admin || 0,
          creator: roleStatsData.data.creator || 0,
          user: roleStatsData.data.user || 0
        });
      }

      // Process activity trend
      if (activityTrend.data && activityTrend.data.length > 0) {
        setSurveyActivity({
          labels: activityTrend.data.map(item => item.date),
          data: activityTrend.data.map(item => item.count)
        });
      }

      // Fetch responses per survey
      const surveysResponse = await SurveyService.getAll().catch(() => ({ data: [] }));
      if (surveysResponse.data && surveysResponse.data.length > 0) {
        const surveyData = surveysResponse.data.slice(0, 10); // Top 10 surveys
        setResponsesPerSurvey({
          labels: surveyData.map(s => s.title || `Survey ${s.id}`),
          data: surveyData.map(s => s.response_count || 0)
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Chart configurations
  const responsesChartData = {
    labels: responsesPerSurvey.labels,
    datasets: [
      {
        label: 'Responses',
        data: responsesPerSurvey.data,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }
    ]
  };

  const responsesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const roleChartData = {
    labels: ['Admin', 'Creator', 'User'],
    datasets: [
      {
        data: [roleStats.admin, roleStats.creator, roleStats.user],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)'
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const roleChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  const activityChartData = {
    labels: surveyActivity.labels,
    datasets: [
      {
        label: 'Survey Activity',
        data: surveyActivity.data,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const activityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Dashboard</h1>
        </div>
        <Loader fullScreen message="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Overview of system statistics and analytics</p>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.actionButton}
            onClick={() => navigate('/admin/users')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 17a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Manage Users
          </button>
          <button 
            className={styles.primaryButton}
            onClick={() => navigate('/templates')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create Template
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          icon="👥"
          title="Total Users"
          value={stats.totalUsers}
          color="primary"
        />
        <StatCard
          icon="📋"
          title="Total Surveys"
          value={stats.totalSurveys}
          color="info"
        />
        <StatCard
          icon="✅"
          title="Total Responses"
          value={stats.totalResponses}
          color="success"
        />
        <StatCard
          icon="🔥"
          title="Active Surveys"
          value={stats.activeSurveys}
          color="warning"
        />
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <ChartCard
          title="Responses per Survey"
          description="Top 10 surveys by response count"
        >
          <Bar data={responsesChartData} options={responsesChartOptions} />
        </ChartCard>

        <ChartCard
          title="User Roles Distribution"
          description="Breakdown of users by role"
        >
          <Pie data={roleChartData} options={roleChartOptions} />
        </ChartCard>
      </div>

      {/* Activity Chart - Full Width */}
      <div className={styles.fullWidthChart}>
        <ChartCard
          title="Survey Activity Trend"
          description="Survey creation activity over time"
        >
          <Line data={activityChartData} options={activityChartOptions} />
        </ChartCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
