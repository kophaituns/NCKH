// Test survey creation API
const generateAndCreateSurvey = async () => {
  try {
    console.log('🚀 Testing survey creation...');
    
    // First generate some questions
    const questionsResponse = await fetch('http://localhost:5001/api/modules/llm/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMjE5MzgwNCwiZXhwIjoxNzMyMjgwMjA0fQ.OBCbS6AcJQMqPOFvEhj-WGLbR2vwbf1U6A5dAZNEWyY'
      },
      body: JSON.stringify({
        keyword: 'test survey',
        category: '',
        count: 3
      })
    });

    if (!questionsResponse.ok) {
      throw new Error(`Questions API error: ${questionsResponse.status}`);
    }

    const questionsData = await questionsResponse.json();
    console.log('✅ Generated questions:', questionsData);

    // Now create survey from these questions
    const surveyData = {
      title: 'Test Survey from AI Questions',
      description: 'Testing survey creation with AI generated questions',
      selectedQuestions: questionsData.questions.slice(0, 2), // Take first 2 questions
      customQuestions: [
        {
          text: 'What do you think about our new feature?',
          type: 'text',
          required: true
        }
      ],
      settings: {
        target_audience: 'developers',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        shareSettings: {
          isPublic: false,
          allowAnonymous: true,
          requireLogin: false,
          expiryDays: 30
        }
      }
    };

    console.log('📤 Creating survey with data:', surveyData);

    const surveyResponse = await fetch('http://localhost:5001/api/modules/llm/create-survey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMjE5MzgwNCwiZXhwIjoxNzMyMjgwMjA0fQ.OBCbS6AcJQMqPOFvEhj-WGLbR2vwbf1U6A5dAZNEWyY'
      },
      body: JSON.stringify(surveyData)
    });

    console.log('📥 Survey Response Status:', surveyResponse.status);
    
    if (!surveyResponse.ok) {
      const errorText = await surveyResponse.text();
      console.error('❌ Survey creation failed:', errorText);
      return;
    }

    const surveyResult = await surveyResponse.json();
    console.log('🎉 Survey created successfully:', surveyResult);

    return surveyResult;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
generateAndCreateSurvey();