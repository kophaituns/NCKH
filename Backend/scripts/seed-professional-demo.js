#!/usr/bin/env node

/**
 * Professional Demo Data Seeder (English Version)
 * Creates high-quality English surveys with realistic responses
 * For presentation/demo purposes
 * Run: node scripts/seed-professional-demo.js
 */

require('dotenv').config();

const {
    sequelize,
    User,
    SurveyTemplate,
    Question,
    QuestionOption,
    Survey,
    SurveyCollector,
    SurveyResponse,
    Answer
} = require('../src/models');

const { QUESTION_TYPES } = require('../src/constants/questionTypes');

// ============================================
// PROFESSIONAL SURVEY TEMPLATES (ENGLISH)
// ============================================

const TEMPLATES = [
    {
        title: 'Customer Experience Survey 2024',
        description: 'Measure customer satisfaction and collect feedback to improve service quality.',
        category: 'Customer Experience',
        questions: [
            {
                label: 'Q1',
                question_text: 'How satisfied are you with our overall service?',
                question_type_id: QUESTION_TYPES.RATING,
                required: true,
                display_order: 1
            },
            {
                label: 'Q2',
                question_text: 'On a scale of 0-10, how likely are you to recommend our service to a friend or colleague?',
                question_type_id: QUESTION_TYPES.RATING,
                required: true,
                display_order: 2
            },
            {
                label: 'Q3',
                question_text: 'What do you like most about our service?',
                question_type_id: QUESTION_TYPES.SINGLE_CHOICE,
                required: true,
                display_order: 3,
                options: [
                    'Product/Service Quality',
                    'Customer Support',
                    'Competitive Pricing',
                    'Fast Response Time',
                    'After-sales Support'
                ]
            },
            {
                label: 'Q4',
                question_text: 'Which of our services have you used? (Select all that apply)',
                question_type_id: QUESTION_TYPES.MULTIPLE_CHOICE,
                required: false,
                display_order: 4,
                options: [
                    'Online Consultation',
                    'In-store Purchase',
                    'Mobile App/Website Order',
                    'Warranty/Repair Service',
                    'VIP/Premium Services'
                ]
            },
            {
                label: 'Q5',
                question_text: 'Do you have any suggestions for how we can improve our service?',
                question_type_id: QUESTION_TYPES.OPEN_ENDED,
                required: false,
                display_order: 5
            }
        ]
    },
    {
        title: 'Employee Engagement Survey Q4/2024',
        description: 'Quarterly survey to assess workplace environment and employee engagement levels.',
        category: 'Human Resources',
        questions: [
            {
                label: 'ENG1',
                question_text: 'I feel recognized and valued for my contributions at work.',
                question_type_id: QUESTION_TYPES.LIKERT_SCALE,
                required: true,
                display_order: 1
            },
            {
                label: 'ENG2',
                question_text: 'I have the tools and resources I need to do my job effectively.',
                question_type_id: QUESTION_TYPES.LIKERT_SCALE,
                required: true,
                display_order: 2
            },
            {
                label: 'ENG3',
                question_text: 'My direct manager listens to me and provides support when needed.',
                question_type_id: QUESTION_TYPES.LIKERT_SCALE,
                required: true,
                display_order: 3
            },
            {
                label: 'ENG4',
                question_text: 'Which department do you belong to?',
                question_type_id: QUESTION_TYPES.DROPDOWN,
                required: true,
                display_order: 4,
                options: [
                    'Sales & Marketing',
                    'Technology & IT',
                    'Human Resources & Admin',
                    'Finance & Accounting',
                    'Operations & Production',
                    'Other'
                ]
            },
            {
                label: 'ENG5',
                question_text: 'What would you most like to see improved in our workplace?',
                question_type_id: QUESTION_TYPES.OPEN_ENDED,
                required: false,
                display_order: 5
            }
        ]
    },
    {
        title: 'Tech Summit 2024 Event Feedback',
        description: 'Collect attendee feedback on content, organization, and overall event experience.',
        category: 'Event Feedback',
        questions: [
            {
                label: 'EVT1',
                question_text: 'How would you rate the overall quality of the event?',
                question_type_id: QUESTION_TYPES.RATING,
                required: true,
                display_order: 1
            },
            {
                label: 'EVT2',
                question_text: 'Which session did you find most valuable?',
                question_type_id: QUESTION_TYPES.SINGLE_CHOICE,
                required: true,
                display_order: 2,
                options: [
                    'Keynote: The Future of AI in Business',
                    'Workshop: Building Products with GenAI',
                    'Panel: Startups & Tech Investment',
                    'Demo: Latest Technologies',
                    'Networking Session'
                ]
            },
            {
                label: 'EVT3',
                question_text: 'What was your purpose for attending? (Select all that apply)',
                question_type_id: QUESTION_TYPES.MULTIPLE_CHOICE,
                required: false,
                display_order: 3,
                options: [
                    'Learn about new technologies',
                    'Expand professional network',
                    'Find investment/partnership opportunities',
                    'Recruit talent',
                    'Job searching'
                ]
            },
            {
                label: 'EVT4',
                question_text: 'Would you attend our future events?',
                question_type_id: QUESTION_TYPES.SINGLE_CHOICE,
                required: true,
                display_order: 4,
                options: [
                    'Definitely yes',
                    'Probably yes',
                    'Not sure',
                    'Probably not',
                    'Definitely not'
                ]
            },
            {
                label: 'EVT5',
                question_text: 'Do you have any suggestions for improving future events?',
                question_type_id: QUESTION_TYPES.OPEN_ENDED,
                required: false,
                display_order: 5
            }
        ]
    },
    {
        title: 'AI Tools Market Research Survey',
        description: 'Research on AI tool usage habits and needs among professionals.',
        category: 'Market Research',
        questions: [
            {
                label: 'MKT1',
                question_text: 'How often do you use AI tools (like ChatGPT, Gemini, Copilot) for work?',
                question_type_id: QUESTION_TYPES.SINGLE_CHOICE,
                required: true,
                display_order: 1,
                options: [
                    'Daily',
                    'Several times a week',
                    'Occasionally',
                    'Rarely',
                    'Never'
                ]
            },
            {
                label: 'MKT2',
                question_text: 'What do you use AI for? (Select all that apply)',
                question_type_id: QUESTION_TYPES.MULTIPLE_CHOICE,
                required: false,
                display_order: 2,
                options: [
                    'Writing and editing text',
                    'Programming/Coding',
                    'Data analysis',
                    'Image generation/Design',
                    'Research and information search',
                    'Translation',
                    'Other'
                ]
            },
            {
                label: 'MKT3',
                question_text: 'How much would you be willing to pay monthly for premium AI tools?',
                question_type_id: QUESTION_TYPES.SINGLE_CHOICE,
                required: true,
                display_order: 3,
                options: [
                    'Free only',
                    'Under $10',
                    '$10 - $25',
                    '$25 - $50',
                    'Over $50'
                ]
            },
            {
                label: 'MKT4',
                question_text: 'How much do you trust AI-generated results?',
                question_type_id: QUESTION_TYPES.RATING,
                required: true,
                display_order: 4
            },
            {
                label: 'MKT5',
                question_text: 'What additional capabilities would you like AI to have in the future?',
                question_type_id: QUESTION_TYPES.OPEN_ENDED,
                required: false,
                display_order: 5
            }
        ]
    }
];

// ============================================
// REALISTIC RESPONSE DATA (ENGLISH)
// ============================================

const OPEN_ENDED_RESPONSES = {
    customer: [
        'Great service! The team was very professional and helpful.',
        'Delivery time could be improved.',
        'Good quality products at reasonable prices.',
        'Would appreciate more payment options.',
        'The app sometimes lags, could use some optimization.',
        'Customer support responds quickly. Very satisfied!',
        'Would love to see more loyalty rewards for returning customers.',
        'Consistent product quality. Will continue to support!',
        null,
        null
    ],
    employee: [
        'Benefits package could be improved.',
        'Would like more training and development opportunities.',
        'Positive work environment with friendly colleagues.',
        'More team building activities would be appreciated.',
        'Workload can be overwhelming sometimes. Better distribution needed.',
        'Really appreciate the open company culture.',
        null,
        null
    ],
    event: [
        'Well-organized event. Would appreciate more networking time.',
        'Very informative and practical content.',
        'Venue was a bit far from downtown. Consider a more central location.',
        'Speakers shared insightful and real-world experiences.',
        'An event app for schedule tracking would be helpful.',
        'Great refreshments and attentive service.',
        null
    ],
    market: [
        'AI saves me a lot of time at work.',
        'Would like AI to understand context better.',
        'Accuracy could be improved for complex data processing.',
        'Better integration with Excel and Google Sheets would be great.',
        'Industry-specific AI assistants would be very useful.',
        null
    ]
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRatingAnswer() {
    const weights = [5, 10, 20, 35, 30];
    const random = Math.random() * 100;
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) return String(i + 1);
    }
    return '4';
}

function generateLikertAnswer() {
    const weights = [5, 10, 25, 40, 20];
    const random = Math.random() * 100;
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) return String(i + 1);
    }
    return '4';
}

// ============================================
// MAIN SEEDER
// ============================================

async function seedProfessionalDemo() {
    console.log('\n========================================');
    console.log('  PROFESSIONAL DEMO DATA SEEDER');
    console.log('  (English Version)');
    console.log('========================================\n');

    try {
        await sequelize.authenticate();
        console.log('[OK] Database connected\n');

        let creator = await User.findOne({ where: { role: 'creator' } });
        if (!creator) {
            creator = await User.findOne({ where: { role: 'admin' } });
        }
        if (!creator) {
            creator = await User.findOne();
        }

        if (!creator) {
            throw new Error('No user found in database. Please create a user first.');
        }

        console.log(`[INFO] Using user: ${creator.email} (${creator.role})\n`);

        const responseCounts = [50, 35, 42, 28];
        const surveyTypes = ['customer', 'employee', 'event', 'market'];

        for (let t = 0; t < TEMPLATES.length; t++) {
            const templateData = TEMPLATES[t];
            const surveyType = surveyTypes[t];
            const numResponses = responseCounts[t];

            console.log(`[CREATING] ${templateData.title}`);

            const template = await SurveyTemplate.create({
                title: templateData.title,
                description: templateData.description,
                category: templateData.category,
                created_by: creator.id
            });

            const createdQuestions = [];
            for (const q of templateData.questions) {
                const question = await Question.create({
                    template_id: template.id,
                    label: q.label,
                    question_text: q.question_text,
                    question_type_id: q.question_type_id,
                    required: q.required,
                    display_order: q.display_order
                });

                if (q.options) {
                    for (let i = 0; i < q.options.length; i++) {
                        await QuestionOption.create({
                            question_id: question.id,
                            option_text: q.options[i],
                            display_order: i + 1
                        });
                    }
                }

                createdQuestions.push({ ...question.toJSON(), options: q.options });
            }

            const now = new Date();
            const survey = await Survey.create({
                template_id: template.id,
                title: templateData.title,
                description: templateData.description,
                created_by: creator.id,
                status: 'active',
                start_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                access_type: 'public',
                allow_anonymous: true
            });

            const uniqueToken = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${t}`;
            const collector = await SurveyCollector.create({
                survey_id: survey.id,
                collector_type: 'web_link',
                token: uniqueToken,
                name: `Survey Link - ${survey.title}`,
                is_active: true,
                created_by: creator.id
            });

            for (let r = 0; r < numResponses; r++) {
                const response = await SurveyResponse.create({
                    survey_id: survey.id,
                    collector_id: collector.id,
                    status: 'completed',
                    created_at: new Date(now.getTime() - getRandomInt(1, 25) * 24 * 60 * 60 * 1000)
                });

                for (const q of createdQuestions) {
                    let answerValue = null;

                    switch (q.question_type_id) {
                        case QUESTION_TYPES.RATING:
                            answerValue = generateRatingAnswer();
                            break;
                        case QUESTION_TYPES.LIKERT_SCALE:
                            answerValue = generateLikertAnswer();
                            break;
                        case QUESTION_TYPES.SINGLE_CHOICE:
                        case QUESTION_TYPES.DROPDOWN:
                            if (q.options) {
                                answerValue = getRandomElement(q.options);
                            }
                            break;
                        case QUESTION_TYPES.MULTIPLE_CHOICE:
                            if (q.options) {
                                const numSelected = getRandomInt(1, Math.min(3, q.options.length));
                                const shuffled = [...q.options].sort(() => 0.5 - Math.random());
                                answerValue = JSON.stringify(shuffled.slice(0, numSelected));
                            }
                            break;
                        case QUESTION_TYPES.OPEN_ENDED:
                        case QUESTION_TYPES.TEXT:
                            answerValue = getRandomElement(OPEN_ENDED_RESPONSES[surveyType]);
                            break;
                    }

                    if (answerValue !== null) {
                        const isNumeric = [QUESTION_TYPES.RATING, QUESTION_TYPES.LIKERT_SCALE].includes(q.question_type_id);
                        await Answer.create({
                            survey_response_id: response.id,
                            question_id: q.id,
                            text_answer: isNumeric ? null : answerValue,
                            numeric_answer: isNumeric ? parseInt(answerValue) : null
                        });
                    }
                }
            }

            console.log(`  [OK] Created ${createdQuestions.length} questions, ${numResponses} responses`);
        }

        console.log('\n========================================');
        console.log('  [SUCCESS] Demo data created!');
        console.log('========================================\n');

        console.log('Summary:');
        console.log('  - 4 professional surveys (English)');
        console.log('  - 20 questions total');
        console.log('  - 155 realistic responses');
        console.log('\nYou can now login and view the surveys.\n');

    } catch (error) {
        console.error('\n[ERROR]', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seedProfessionalDemo();
