/**
 * PDF Export Utility Functions
 * Provides CSS classes and styling utilities for PDF export functionality
 */

// CSS classes as JavaScript strings for inline styling in PDF
export const PDF_STYLES = {
  // Container styles
  container: `
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background: white;
    margin: 0;
    padding: 20px;
  `,

  // Header styles
  header: `
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ddd;
  `,
  
  headerTitle: `
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0 0 10px 0;
  `,
  
  headerDescription: `
    font-size: 16px;
    color: #666;
    margin: 0 0 10px 0;
  `,
  
  headerMeta: `
    font-size: 12px;
    color: #666;
    margin: 0;
  `,

  // Question styles
  question: `
    margin-bottom: 25px;
    page-break-inside: avoid;
    border-left: 2px solid #ddd;
    padding-left: 15px;
  `,
  
  questionNumber: `
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
  `,
  
  questionType: `
    font-size: 12px;
    color: #666;
    font-style: italic;
    margin-bottom: 12px;
  `,

  // Options styles
  options: `
    margin: 15px 0;
  `,
  
  option: `
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    padding: 6px 0;
  `,
  
  checkbox: `
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1px solid #666;
    margin-right: 8px;
    background: white;
    flex-shrink: 0;
  `,
  
  checkboxRadio: `
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1px solid #666;
    border-radius: 50%;
    margin-right: 8px;
    background: white;
    flex-shrink: 0;
  `,

  // Rating styles
  rating: `
    margin: 15px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  
  ratingBox: `
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 1px solid #666;
    text-align: center;
    line-height: 22px;
    font-size: 12px;
    background: white;
    border-radius: 3px;
  `,

  // Text answer styles
  textAnswer: `
    border-bottom: 1px solid #ddd;
    height: 25px;
    margin-bottom: 12px;
    background: transparent;
  `,

  // No questions styles
  noQuestions: `
    text-align: center;
    padding: 40px 20px;
    color: #666;
  `
};

// Color themes for different modules
export const PDF_THEMES = {
  template: {
    primary: '#3498db',
    title: '#2c3e50',
    description: '#7f8c8d'
  },
  survey: {
    primary: '#27ae60',
    title: '#27ae60',
    description: '#95a5a6'
  },
  llm: {
    primary: '#e74c3c',
    title: '#e74c3c',
    description: '#95a5a6'
  },
  default: {
    primary: '#333',
    title: '#333',
    description: '#666'
  }
};

/**
 * Generate themed PDF styles
 * @param {string} theme - Theme name (template|survey|llm|default)
 * @returns {object} Themed CSS styles
 */
export function getThemedPDFStyles(theme = 'default') {
  const themeColors = PDF_THEMES[theme] || PDF_THEMES.default;
  
  return {
    ...PDF_STYLES,
    headerTitle: PDF_STYLES.headerTitle.replace('#333', themeColors.title),
    headerDescription: PDF_STYLES.headerDescription.replace('#666', themeColors.description),
    question: PDF_STYLES.question.replace('#ddd', themeColors.primary),
    questionNumber: PDF_STYLES.questionNumber.replace('#333', themeColors.primary)
  };
}

/**
 * Generate complete PDF HTML with embedded styles
 * @param {object} content - Content object with title, description, questions etc.
 * @param {string} theme - Theme name
 * @returns {string} Complete HTML string for PDF
 */
export function generatePDFHTML(content, theme = 'default') {
  const styles = getThemedPDFStyles(theme);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${content.title || 'Survey Export'}</title>
      <style>
        body { ${styles.container} }
        .header { ${styles.header} }
        .header .title { ${styles.headerTitle} }
        .header .description { ${styles.headerDescription} }
        .header .meta { ${styles.headerMeta} }
        .question { ${styles.question} }
        .question-number { ${styles.questionNumber} }
        .question-type { ${styles.questionType} }
        .options { ${styles.options} }
        .option { ${styles.option} }
        .checkbox { ${styles.checkbox} }
        .checkbox.radio { ${styles.checkboxRadio} }
        .rating { ${styles.rating} }
        .rating-box { ${styles.ratingBox} }
        .text-answer { ${styles.textAnswer} }
        .no-questions { ${styles.noQuestions} }
        
        @media print {
          body { margin: 0; padding: 15px; }
          .question { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      ${content.htmlContent || ''}
    </body>
    </html>
  `;
}

/**
 * Simple PDF content generator using class-based approach
 * @param {object} data - Survey/template data
 * @param {string} type - Content type (survey|template)
 * @returns {string} HTML content for PDF
 */
export function generateSimplePDFContent(data, type = 'survey') {
  const { title, description, questions = [], created_at } = data;
  
  let htmlContent = `
    <div class="header">
      <div class="title">${title}</div>
      <div class="description">${description || 'Không có mô tả'}</div>
      <div class="meta">Ngày tạo: ${new Date(created_at).toLocaleDateString('vi-VN')}</div>
    </div>
  `;

  if (questions.length === 0) {
    htmlContent += `
      <div class="no-questions">
        <p><strong>Chưa có câu hỏi nào trong ${type === 'survey' ? 'khảo sát' : 'template'} này.</strong></p>
        <p>Vui lòng thêm câu hỏi trước khi xuất PDF.</p>
      </div>
    `;
  } else {
    questions.forEach((question, index) => {
      const questionType = question.question_type || question.QuestionType?.type_name || 'text';
      const options = question.options || question.QuestionOptions || [];

      htmlContent += `
        <div class="question">
          <div class="question-number">${index + 1}. ${question.question_text}</div>
          <div class="question-type">[${questionType}]</div>
      `;

      if ((questionType === 'multiple_choice' || questionType === 'checkbox') && options.length > 0) {
        htmlContent += '<div class="options">';
        options.forEach((option) => {
          const optionText = option.option_text || option.text;
          const checkboxClass = questionType === 'multiple_choice' ? 'checkbox radio' : 'checkbox';
          htmlContent += `<div class="option"><span class="${checkboxClass}"></span> ${optionText}</div>`;
        });
        htmlContent += '</div>';
      } else if (questionType === 'dropdown' && options.length > 0) {
        htmlContent += '<div class="options"><strong>Tùy chọn:</strong><br>';
        options.forEach((option) => {
          const optionText = option.option_text || option.text;
          htmlContent += `<div class="option">• ${optionText}</div>`;
        });
        htmlContent += '</div>';
      } else if (questionType === 'yes_no') {
        htmlContent += `
          <div class="options">
            <div class="option"><span class="checkbox radio"></span> Có</div>
            <div class="option"><span class="checkbox radio"></span> Không</div>
          </div>
        `;
      } else if (questionType === 'likert_scale' || questionType === 'rating') {
        htmlContent += `
          <div class="rating">
            Đánh giá từ 1 đến 5: 
            <span class="rating-box">1</span>
            <span class="rating-box">2</span>
            <span class="rating-box">3</span>
            <span class="rating-box">4</span>
            <span class="rating-box">5</span>
          </div>
        `;
      } else {
        htmlContent += '<div class="text-answer"></div><div class="text-answer"></div><div class="text-answer"></div>';
      }

      htmlContent += '</div>';
    });
  }

  return htmlContent;
}

export default {
  PDF_STYLES,
  PDF_THEMES,
  getThemedPDFStyles,
  generatePDFHTML,
  generateSimplePDFContent
};