// src/pages/Surveys/Results/SurveyResults.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import LLMService from '../../../api/services/llm.service';
import Loader from '../../../components/common/Loader/Loader';
import useToast from '../../../hooks/useToast';
import styles from './SurveyResults.module.scss';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SurveyResults = () => {
  const { surveyId } = useParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await LLMService.getSurveyResults(surveyId);
        setResults(response.data);
      } catch (error) {
        console.error('Error fetching survey results:', error);
        setError(error.response?.data?.message || 'Failed to load survey results');
        showToast(error.response?.data?.message || 'Failed to load survey results', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (surveyId) {
      fetchResults();
    }
  }, [surveyId, showToast]);

  const generateChartColors = (count) => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  };

  const renderQuestionChart = (question) => {
    if (question.type === 'text' || question.type === 'open_ended') {
      // Display text responses
      return (
        <div className={styles.textAnswers}>
          <h4>Text Responses ({question.totalAnswers})</h4>
          <div className={styles.textList}>
            {question.textAnswers && question.textAnswers.length > 0 ? (
              question.textAnswers.map((answer, index) => (
                <div key={index} className={styles.textAnswer}>
                  <span className={styles.answerNumber}>#{index + 1}</span>
                  <span className={styles.answerText}>{answer}</span>
                </div>
              ))
            ) : (
              <p className={styles.noResponses}>No responses yet</p>
            )}
          </div>
        </div>
      );
    }

    // For choice-based questions, create charts
    const labels = Object.keys(question.answers);
    const data = Object.values(question.answers);
    const colors = generateChartColors(labels.length);

    if (labels.length === 0) {
      return (
        <div className={styles.noData}>
          <p>No responses yet</p>
        </div>
      );
    }

    const chartData = {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => color + '80'),
        borderWidth: 2
      }]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    };

    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartWrapper}>
          {question.type === 'rating' || question.type === 'likert_scale' ? (
            <Bar data={chartData} options={{
              ...chartOptions,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }} />
          ) : (
            <Pie data={chartData} options={chartOptions} />
          )}
        </div>
        <div className={styles.chartStats}>
          <p><strong>Total Responses:</strong> {question.totalAnswers}</p>
          <div className={styles.breakdown}>
            {labels.map((label, index) => {
              const count = data[index];
              const total = data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
              return (
                <div key={label} className={styles.statItem}>
                  <span 
                    className={styles.colorDot} 
                    style={{ backgroundColor: colors[index] }}
                  ></span>
                  <span>{label}: {count} ({percentage}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error Loading Results</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className={styles.surveyResults}>
      <div className={styles.header}>
        <h1>{results.survey.title}</h1>
        {results.survey.description && (
          <p className={styles.description}>{results.survey.description}</p>
        )}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{results.summary.totalResponses}</span>
            <span className={styles.statLabel}>Total Responses</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{results.summary.completedResponses}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{results.summary.completionRate}%</span>
            <span className={styles.statLabel}>Completion Rate</span>
          </div>
          {results.summary.lastResponseAt && (
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {new Date(results.summary.lastResponseAt).toLocaleDateString()}
              </span>
              <span className={styles.statLabel}>Last Response</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.questions}>
        {results.questions && results.questions.map((question) => (
          <div key={question.id} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <h3>{question.question}</h3>
              <span className={styles.questionType}>{question.type}</span>
            </div>
            <div className={styles.questionContent}>
              {renderQuestionChart(question)}
            </div>
          </div>
        ))}
      </div>

      {results.recentResponses && results.recentResponses.length > 0 && (
        <div className={styles.recentResponses}>
          <h3>Recent Responses</h3>
          <div className={styles.responsesList}>
            {results.recentResponses.map((response) => (
              <div key={response.id} className={styles.responseItem}>
                <span className={styles.responseId}>#{response.id}</span>
                <span className={styles.responseDate}>
                  {new Date(response.created_at).toLocaleString()}
                </span>
                <span className={`${styles.responseStatus} ${styles[response.status]}`}>
                  {response.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyResults;