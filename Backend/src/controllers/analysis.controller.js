// src/controllers/analysis.controller.js
const { AnalysisResult, Survey, SurveyResponse, Answer, Question, Visualization } = require('../models');
const logger = require('../utils/logger');

/**
 * Phân tích dữ liệu câu trả lời của một cuộc khảo sát
 */
const analyzeResponses = async (req, res) => {
  const { surveyId } = req.params;
  
  try {
    // Kiểm tra xem survey có tồn tại không
    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy khảo sát' });
    }
    
    // Kiểm tra quyền - người dùng phải là người tạo hoặc admin
    if (req.user.role !== 'admin' && survey.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền phân tích khảo sát này' });
    }
    
    // Lấy tất cả câu trả lời
    const responses = await SurveyResponse.findAll({
      where: { survey_id: surveyId, completed: true },
      include: [{
        model: Answer,
        include: [Question]
      }]
    });
    
    if (responses.length === 0) {
      return res.status(400).json({ message: 'Khảo sát chưa có câu trả lời nào' });
    }
    
    // Thực hiện phân tích
    const analysisData = {
      participantCount: responses.length,
      completionRate: 100, // Ở đây chỉ đang lấy các completed responses
      answerAnalysis: {}
    };
    
    // Thống kê câu trả lời
    const questionStats = {};
    let totalRating = 0;
    let ratingCount = 0;
    
    responses.forEach(response => {
      response.Answers.forEach(answer => {
        const questionId = answer.question_id;
        const questionText = answer.Question.question_text;
        const questionType = answer.Question.question_type_id;
        
        if (!questionStats[questionId]) {
          questionStats[questionId] = {
            questionText,
            questionType,
            answers: []
          };
        }
        
        questionStats[questionId].answers.push(answer.answer_text);
        
        // Nếu là câu hỏi đánh giá (rating)
        if (questionType === 4 && !isNaN(parseInt(answer.answer_text))) {
          totalRating += parseInt(answer.answer_text);
          ratingCount++;
        }
      });
    });
    
    // Tính toán các số liệu tổng hợp
    analysisData.averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;
    analysisData.questionStats = Object.values(questionStats).map(stat => {
      const result = {
        questionText: stat.questionText,
        questionType: stat.questionType,
        totalAnswers: stat.answers.length
      };
      
      // Xử lý theo loại câu hỏi
      if (stat.questionType === 1 || stat.questionType === 2) { // Multiple choice hoặc checkbox
        const answerCounts = {};
        stat.answers.forEach(ans => {
          // Với checkbox, các lựa chọn được phân tách bằng dấu phẩy
          const options = stat.questionType === 2 ? ans.split(',') : [ans];
          
          options.forEach(option => {
            answerCounts[option] = (answerCounts[option] || 0) + 1;
          });
        });
        result.distribution = answerCounts;
      } else if (stat.questionType === 3) { // Text
        // Đơn giản hóa bằng cách chỉ lấy một số câu trả lời
        result.sampleAnswers = stat.answers.slice(0, 5);
      } else if (stat.questionType === 4) { // Rating
        const ratings = stat.answers.map(a => parseInt(a)).filter(a => !isNaN(a));
        result.averageRating = ratings.length > 0 
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
          : 0;
      }
      
      return result;
    });
    
    // Lưu kết quả phân tích
    const analysisResult = await AnalysisResult.create({
      survey_id: surveyId,
      result_type: 'detailed',
      result_data: JSON.stringify(analysisData),
    });
    
    res.status(200).json({
      message: 'Phân tích khảo sát thành công',
      analysisId: analysisResult.id,
      analysis: analysisData
    });
  } catch (error) {
    logger.error(`Error analyzing survey responses: ${error.message}`);
    res.status(500).json({ message: 'Lỗi khi phân tích khảo sát', error: error.message });
  }
};

/**
 * Lấy kết quả phân tích đã có
 */
const getAnalysisResults = async (req, res) => {
  const { surveyId } = req.params;
  
  try {
    // Kiểm tra quyền truy cập khảo sát
    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy khảo sát' });
    }
    
    if (req.user.role !== 'admin' && survey.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền xem kết quả phân tích này' });
    }
    
    // Lấy kết quả phân tích
    const analysisResults = await AnalysisResult.findAll({
      where: { survey_id: surveyId },
      include: [Visualization],
      order: [['created_at', 'DESC']]
    });
    
    if (analysisResults.length === 0) {
      return res.status(404).json({ message: 'Chưa có kết quả phân tích nào cho khảo sát này' });
    }
    
    // Chuyển đổi dữ liệu JSON
    const formattedResults = analysisResults.map(result => {
      try {
        return {
          id: result.id,
          surveyId: result.survey_id,
          resultType: result.result_type,
          resultData: JSON.parse(result.result_data),
          createdAt: result.created_at,
          visualizations: result.Visualizations?.map(v => ({
            id: v.id,
            type: v.visualization_type,
            data: JSON.parse(v.visualization_data)
          })) || []
        };
      } catch (e) {
        return {
          id: result.id,
          surveyId: result.survey_id,
          resultType: result.result_type,
          resultData: { error: 'Không thể phân tích dữ liệu JSON' },
          createdAt: result.created_at,
          visualizations: []
        };
      }
    });
    
    res.status(200).json(formattedResults);
  } catch (error) {
    logger.error(`Error retrieving analysis results: ${error.message}`);
    res.status(500).json({ message: 'Lỗi khi lấy kết quả phân tích', error: error.message });
  }
};

/**
 * Tạo các biểu đồ trực quan hóa dữ liệu
 */
const generateVisualization = async (req, res) => {
  const { surveyId } = req.params;
  const { analysisId, visualizationType, questionId } = req.body;
  
  if (!analysisId || !visualizationType) {
    return res.status(400).json({ message: 'Thiếu thông tin cần thiết để tạo biểu đồ' });
  }
  
  try {
    // Kiểm tra quyền truy cập
    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy khảo sát' });
    }
    
    if (req.user.role !== 'admin' && survey.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền tạo biểu đồ cho khảo sát này' });
    }
    
    // Lấy kết quả phân tích
    const analysisResult = await AnalysisResult.findByPk(analysisId);
    if (!analysisResult) {
      return res.status(404).json({ message: 'Không tìm thấy kết quả phân tích' });
    }
    
    let analysisData;
    try {
      analysisData = JSON.parse(analysisResult.result_data);
    } catch (e) {
      return res.status(400).json({ message: 'Dữ liệu phân tích không hợp lệ' });
    }
    
    // Tạo dữ liệu cho biểu đồ
    let visualizationData = {};
    
    if (questionId) {
      // Tạo biểu đồ cho một câu hỏi cụ thể
      const questionStat = analysisData.questionStats.find(q => 
        q.questionText.includes(questionId) || q.questionText === questionId
      );
      
      if (!questionStat) {
        return res.status(404).json({ message: 'Không tìm thấy dữ liệu cho câu hỏi này' });
      }
      
      switch (visualizationType) {
        case 'pie_chart':
          if (questionStat.distribution) {
            visualizationData = {
              title: `Biểu đồ tròn: ${questionStat.questionText}`,
              labels: Object.keys(questionStat.distribution),
              data: Object.values(questionStat.distribution)
            };
          } else if (questionStat.averageRating) {
            // Không phù hợp cho biểu đồ tròn
            return res.status(400).json({ message: 'Loại câu hỏi này không phù hợp với biểu đồ tròn' });
          }
          break;
          
        case 'bar_chart':
          if (questionStat.distribution) {
            visualizationData = {
              title: `Biểu đồ cột: ${questionStat.questionText}`,
              labels: Object.keys(questionStat.distribution),
              data: Object.values(questionStat.distribution)
            };
          } else if (questionStat.averageRating) {
            // Biểu đồ cột cho rating
            visualizationData = {
              title: `Biểu đồ cột đánh giá: ${questionStat.questionText}`,
              average: questionStat.averageRating,
              max: 5 // Giả sử thang đánh giá 5 điểm
            };
          }
          break;
          
        case 'word_cloud':
          if (questionStat.sampleAnswers) {
            visualizationData = {
              title: `Biểu đồ mây từ: ${questionStat.questionText}`,
              data: questionStat.sampleAnswers
            };
          } else {
            return res.status(400).json({ message: 'Loại câu hỏi này không phù hợp với biểu đồ mây từ' });
          }
          break;
          
        default:
          return res.status(400).json({ message: 'Loại biểu đồ không được hỗ trợ' });
      }
    } else {
      // Tạo biểu đồ tổng quan
      switch (visualizationType) {
        case 'summary_chart':
          visualizationData = {
            title: `Tổng quan khảo sát: ${survey.title}`,
            participantCount: analysisData.participantCount,
            completionRate: analysisData.completionRate,
            averageRating: analysisData.averageRating
          };
          break;
          
        default:
          return res.status(400).json({ message: 'Loại biểu đồ không được hỗ trợ cho tổng quan' });
      }
    }
    
    // Lưu biểu đồ
    const visualization = await Visualization.create({
      analysis_id: analysisId,
      visualization_type: visualizationType,
      visualization_data: JSON.stringify(visualizationData)
    });
    
    res.status(201).json({
      message: 'Tạo biểu đồ thành công',
      visualization: {
        id: visualization.id,
        type: visualization.visualization_type,
        data: visualizationData
      }
    });
  } catch (error) {
    logger.error(`Error generating visualization: ${error.message}`);
    res.status(500).json({ message: 'Lỗi khi tạo biểu đồ', error: error.message });
  }
};

/**
 * Xuất báo cáo phân tích
 */
const exportAnalysisReport = async (req, res) => {
  const { surveyId } = req.params;
  
  try {
    // Kiểm tra quyền truy cập
    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy khảo sát' });
    }
    
    if (req.user.role !== 'admin' && survey.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền xuất báo cáo này' });
    }
    
    // Lấy kết quả phân tích mới nhất
    const analysisResult = await AnalysisResult.findOne({
      where: { survey_id: surveyId },
      include: [Visualization],
      order: [['created_at', 'DESC']]
    });
    
    if (!analysisResult) {
      return res.status(404).json({ message: 'Chưa có kết quả phân tích nào cho khảo sát này' });
    }
    
    // Lấy thông tin về khảo sát
    const responsesCount = await SurveyResponse.count({
      where: { survey_id: surveyId, completed: true }
    });
    
    // Tạo đối tượng báo cáo
    let analysisData;
    try {
      analysisData = JSON.parse(analysisResult.result_data);
    } catch (e) {
      return res.status(400).json({ message: 'Dữ liệu phân tích không hợp lệ' });
    }
    
    const report = {
      surveyTitle: survey.title,
      surveyDescription: survey.description,
      generatedDate: new Date().toISOString(),
      summary: {
        totalResponses: responsesCount,
        completionRate: analysisData.completionRate || 0,
        averageRating: analysisData.averageRating || 0
      },
      detailedResults: analysisData.questionStats || [],
      visualizations: analysisResult.Visualizations?.map(v => ({
        type: v.visualization_type,
        data: JSON.parse(v.visualization_data)
      })) || []
    };
    
    res.status(200).json({
      message: 'Xuất báo cáo thành công',
      report
    });
  } catch (error) {
    logger.error(`Error exporting analysis report: ${error.message}`);
    res.status(500).json({ message: 'Lỗi khi xuất báo cáo', error: error.message });
  }
};

module.exports = {
  analyzeResponses,
  getAnalysisResults,
  generateVisualization,
  exportAnalysisReport
};
