/**
 * ============================================================================
 * SMART SEEDING SCRIPT - Multi-Domain AI Data
 * ============================================================================
 * Ngành IT: Survey "Chất lượng thực hành Lab" + 5 câu hỏi kỹ thuật + 20 phản hồi tiêu cực về phần cứng
 * Ngành Sales: Survey "Mức độ hài lòng với giá cả" + 5 câu hỏi thị trường + 20 phản hồi tích cực về chiết khấu
 * Ngành Marketing: Survey "Nhận diện thương hiệu ALLMTAGS" + 5 câu hỏi về hình ảnh + 20 phản hồi trung lập
 * 
 * Port: MySQL 3307 | Database: llm_survey_db
 * ============================================================================
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mysql = require('mysql2/promise');

// Database configuration for Docker MySQL on port 3307
const DB_CONFIG = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'llm_survey_db',
    charset: 'utf8mb4'
};

console.log('📊 Database Config:', {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.user
});

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

const SEED_DATA = {
    // ==== NGÀNH IT ====
    it: {
        survey: {
            title: 'Khảo sát Chất lượng Thực hành Lab IT',
            description: 'Đánh giá chất lượng phòng thực hành Lab và thiết bị phần cứng phục vụ học tập IT',
            category: 'it'
        },
        template: {
            title: 'Template Khảo sát Lab IT',
            description: 'Template đánh giá chất lượng Lab IT'
        },
        questions: [
            {
                label: 'Q1 - Đánh giá phần cứng',
                question_text: 'Đánh giá mức độ hài lòng của bạn với chất lượng máy tính trong phòng Lab?',
                question_type_id: 3, // RATING
                category: 'it',
                keyword: 'hardware lab'
            },
            {
                label: 'Q2 - Tốc độ mạng',
                question_text: 'Bạn đánh giá như thế nào về tốc độ và độ ổn định của mạng Internet trong Lab?',
                question_type_id: 3, // RATING
                category: 'it',
                keyword: 'network performance'
            },
            {
                label: 'Q3 - Phần mềm',
                question_text: 'Các phần mềm phát triển (IDE, compiler, tools) có đáp ứng đủ nhu cầu học tập không?',
                question_type_id: 2, // MULTIPLE_CHOICE
                category: 'it',
                keyword: 'development software',
                options: ['Hoàn toàn đủ', 'Cơ bản đủ', 'Thiếu một số công cụ', 'Thiếu nhiều', 'Không đáp ứng được']
            },
            {
                label: 'Q4 - Vấn đề thường gặp',
                question_text: 'Liệt kê các vấn đề kỹ thuật bạn thường gặp khi sử dụng Lab?',
                question_type_id: 1, // TEXT
                category: 'it',
                keyword: 'technical issues'
            },
            {
                label: 'Q5 - Đề xuất cải thiện',
                question_text: 'Bạn có đề xuất gì để nâng cấp cơ sở vật chất phòng Lab?',
                question_type_id: 1, // TEXT
                category: 'it',
                keyword: 'infrastructure upgrade'
            }
        ],
        // 20 phản hồi TIÊU CỰC về phần cứng
        responses: Array.from({ length: 20 }, (_, i) => ({
            answers: [
                { question_index: 0, value: Math.floor(Math.random() * 2) + 1 }, // Rating 1-2 (tiêu cực)
                { question_index: 1, value: Math.floor(Math.random() * 2) + 1 }, // Rating 1-2
                { question_index: 2, value: ['Thiếu nhiều', 'Không đáp ứng được', 'Thiếu một số công cụ'][Math.floor(Math.random() * 3)] },
                { question_index: 3, value: [
                    'Máy tính quá chậm, đã lỗi thời từ 5 năm trước',
                    'Ổ cứng hỏng liên tục, mất dữ liệu của sinh viên',
                    'RAM không đủ để chạy các IDE hiện đại như VSCode',
                    'Card màn hình hỏng, không thể học đồ họa',
                    'Bàn phím và chuột hư hỏng, phải mang thiết bị cá nhân',
                    'Máy bị virus nặng, khởi động mất 15 phút',
                    'Không có SSD, load project rất chậm',
                    'Quạt tản nhiệt ồn như máy bay, không tập trung được',
                    'Màn hình bị ám vàng, nhức mắt khi code lâu',
                    'Cấu hình quá yếu để chạy Docker và máy ảo'
                ][i % 10] },
                { question_index: 4, value: [
                    'Cần thay toàn bộ máy tính mới, cấu hình tối thiểu i5 Gen 12, 16GB RAM, SSD 512GB',
                    'Lắp thêm điều hòa, nhiệt độ phòng Lab quá nóng làm máy chạy chậm',
                    'Nâng cấp đường truyền Internet từ 50Mbps lên 1Gbps',
                    'Cài đặt phần mềm chống virus bản quyền thay vì bản crack',
                    'Trang bị ổ cắm điện đủ cho sinh viên mang laptop cá nhân',
                    'Mua license các IDE và phần mềm chuyên nghiệp',
                    'Thay thế toàn bộ bàn phím cơ học và chuột gaming',
                    'Nâng cấp màn hình lên 24 inch Full HD',
                    'Lắp đặt hệ thống backup tự động tránh mất dữ liệu',
                    'Thuê kỹ thuật viên IT chuyên trách để bảo trì định kỳ'
                ][i % 10] }
            ],
            sentiment: 'negative',
            respondent_index: i
        })),
        analysis_result: {
            analysis_type: 'sentiment',
            result_data: {
                summary: 'Phần lớn phản hồi thể hiện sự không hài lòng với cơ sở vật chất Lab IT',
                overall_sentiment: 'negative',
                sentiment_distribution: {
                    positive: 5,
                    neutral: 10,
                    negative: 85
                },
                key_issues: [
                    'Phần cứng máy tính lỗi thời (85% phản hồi)',
                    'Tốc độ mạng chậm và không ổn định (70% phản hồi)',
                    'Thiếu phần mềm phát triển cần thiết (60% phản hồi)',
                    'Thiết bị ngoại vi hư hỏng (55% phản hồi)'
                ],
                recommendations: [
                    'Ưu tiên nâng cấp phần cứng máy tính',
                    'Cải thiện hạ tầng mạng',
                    'Mua license phần mềm bản quyền',
                    'Thiết lập quy trình bảo trì định kỳ'
                ],
                category: 'it',
                analyzed_at: new Date().toISOString()
            }
        }
    },

    // ==== NGÀNH SALES ====
    sales: {
        survey: {
            title: 'Khảo sát Mức độ hài lòng với Giá cả và Chính sách Chiết khấu',
            description: 'Thu thập phản hồi khách hàng về giá cả sản phẩm và các chương trình khuyến mãi',
            category: 'sale'
        },
        template: {
            title: 'Template Khảo sát Giá cả Sales',
            description: 'Template đánh giá mức độ hài lòng về giá và chiết khấu'
        },
        questions: [
            {
                label: 'Q1 - Hài lòng về giá',
                question_text: 'Đánh giá mức độ hài lòng của bạn với giá cả sản phẩm hiện tại?',
                question_type_id: 3, // RATING
                category: 'sale',
                keyword: 'pricing satisfaction'
            },
            {
                label: 'Q2 - Chính sách chiết khấu',
                question_text: 'Bạn đánh giá như thế nào về các chương trình chiết khấu và khuyến mãi?',
                question_type_id: 3, // RATING
                category: 'sale',
                keyword: 'discount policy'
            },
            {
                label: 'Q3 - So sánh đối thủ',
                question_text: 'So với đối thủ cạnh tranh, giá cả của chúng tôi như thế nào?',
                question_type_id: 2, // MULTIPLE_CHOICE
                category: 'sale',
                keyword: 'competitive pricing',
                options: ['Rẻ hơn nhiều', 'Rẻ hơn một chút', 'Tương đương', 'Đắt hơn một chút', 'Đắt hơn nhiều']
            },
            {
                label: 'Q4 - Giá trị nhận được',
                question_text: 'Bạn có cảm thấy giá trị nhận được xứng đáng với số tiền bỏ ra không?',
                question_type_id: 2, // MULTIPLE_CHOICE
                category: 'sale',
                keyword: 'value for money',
                options: ['Rất xứng đáng', 'Khá xứng đáng', 'Bình thường', 'Chưa xứng đáng', 'Không xứng đáng']
            },
            {
                label: 'Q5 - Phản hồi thêm',
                question_text: 'Chia sẻ trải nghiệm mua hàng và nhận chiết khấu của bạn?',
                question_type_id: 1, // TEXT
                category: 'sale',
                keyword: 'purchase experience'
            }
        ],
        // 20 phản hồi TÍCH CỰC về chiết khấu
        responses: Array.from({ length: 20 }, (_, i) => ({
            answers: [
                { question_index: 0, value: Math.floor(Math.random() * 2) + 4 }, // Rating 4-5 (tích cực)
                { question_index: 1, value: Math.floor(Math.random() * 2) + 4 }, // Rating 4-5
                { question_index: 2, value: ['Rẻ hơn nhiều', 'Rẻ hơn một chút', 'Tương đương'][Math.floor(Math.random() * 3)] },
                { question_index: 3, value: ['Rất xứng đáng', 'Khá xứng đáng'][Math.floor(Math.random() * 2)] },
                { question_index: 4, value: [
                    'Chương trình chiết khấu 30% rất hấp dẫn, tôi đã mua thêm 5 sản phẩm',
                    'Được tặng voucher 500k cho lần mua tiếp theo, rất vui!',
                    'Flash sale giảm 50% thật sự bất ngờ, chất lượng vẫn đảm bảo',
                    'Chính sách mua 3 tặng 1 giúp tôi tiết kiệm đáng kể',
                    'Được freeship + chiết khấu 20% cho member VIP',
                    'Combo deal giá chỉ bằng 60% mua lẻ, quá hời!',
                    'Black Friday giảm đến 70%, đã chờ cả năm để mua',
                    'Tích điểm đổi quà rất có giá trị, đã đổi được máy xay sinh tố',
                    'Giá wholesale cho khách mua số lượng lớn rất cạnh tranh',
                    'Chương trình giới thiệu bạn bè được thêm 15% chiết khấu',
                    'Được áp dụng mã giảm giá 25% + freeship, tiết kiệm 800k',
                    'Happy hour giảm 40% từ 12h-14h, đã canh mua được 10 món',
                    'Chính sách đổi trả linh hoạt + hoàn tiền nếu giá giảm trong 7 ngày',
                    'Được tặng quà sinh nhật trị giá 1 triệu đồng, rất cảm động',
                    'Giá member rẻ hơn 25% so với giá niêm yết',
                    'Combo tiết kiệm giúp mua đủ set sản phẩm với giá hợp lý',
                    'Chương trình trả góp 0% lãi suất rất tiện lợi',
                    'Được chiết khấu thêm 10% khi thanh toán bằng ví điện tử',
                    'Bundle deal mua laptop tặng chuột + bàn phím, tiết kiệm 2 triệu',
                    'Chính sách giá tốt nhất, được hoàn tiền nếu tìm thấy nơi bán rẻ hơn'
                ][i] }
            ],
            sentiment: 'positive',
            respondent_index: i
        })),
        analysis_result: {
            analysis_type: 'sentiment',
            result_data: {
                summary: 'Khách hàng rất hài lòng với chính sách giá cả và chương trình chiết khấu',
                overall_sentiment: 'positive',
                sentiment_distribution: {
                    positive: 90,
                    neutral: 8,
                    negative: 2
                },
                key_strengths: [
                    'Chính sách chiết khấu hấp dẫn (90% phản hồi tích cực)',
                    'Giá cạnh tranh so với đối thủ (85% đánh giá)',
                    'Giá trị xứng đáng với chi phí (88% hài lòng)',
                    'Chương trình khuyến mãi đa dạng (92% biết đến)'
                ],
                top_promotions: [
                    'Flash sale 50%',
                    'Member VIP discount 20-25%',
                    'Combo deal tiết kiệm 40%',
                    'Chương trình tích điểm đổi quà'
                ],
                category: 'sale',
                analyzed_at: new Date().toISOString()
            }
        }
    },

    // ==== NGÀNH MARKETING ====
    marketing: {
        survey: {
            title: 'Khảo sát Nhận diện Thương hiệu ALLMTAGS',
            description: 'Đánh giá mức độ nhận biết và hình ảnh thương hiệu ALLMTAGS trong mắt khách hàng',
            category: 'marketing'
        },
        template: {
            title: 'Template Khảo sát Thương hiệu Marketing',
            description: 'Template đánh giá nhận diện thương hiệu'
        },
        questions: [
            {
                label: 'Q1 - Mức độ nhận biết',
                question_text: 'Bạn đã biết đến thương hiệu ALLMTAGS qua kênh nào?',
                question_type_id: 2, // MULTIPLE_CHOICE
                category: 'marketing',
                keyword: 'brand awareness',
                options: ['Mạng xã hội', 'Quảng cáo Google', 'Bạn bè giới thiệu', 'Website', 'Sự kiện/Hội thảo', 'Khác']
            },
            {
                label: 'Q2 - Ấn tượng thương hiệu',
                question_text: 'Đánh giá ấn tượng tổng thể của bạn về thương hiệu ALLMTAGS?',
                question_type_id: 3, // RATING
                category: 'marketing',
                keyword: 'brand impression'
            },
            {
                label: 'Q3 - Hình ảnh liên tưởng',
                question_text: 'Khi nhắc đến ALLMTAGS, bạn liên tưởng đến điều gì đầu tiên?',
                question_type_id: 1, // TEXT
                category: 'marketing',
                keyword: 'brand association'
            },
            {
                label: 'Q4 - So sánh thương hiệu',
                question_text: 'So với các thương hiệu cùng ngành, ALLMTAGS ở vị trí nào trong tâm trí bạn?',
                question_type_id: 2, // MULTIPLE_CHOICE
                category: 'marketing',
                keyword: 'brand positioning',
                options: ['Dẫn đầu thị trường', 'Top 3', 'Trung bình', 'Ít được biết đến', 'Chưa từng nghe']
            },
            {
                label: 'Q5 - Đề xuất cải thiện',
                question_text: 'Bạn có góp ý gì để ALLMTAGS cải thiện hình ảnh thương hiệu?',
                question_type_id: 1, // TEXT
                category: 'marketing',
                keyword: 'brand improvement'
            }
        ],
        // 20 phản hồi TRUNG LẬP
        responses: Array.from({ length: 20 }, (_, i) => ({
            answers: [
                { question_index: 0, value: ['Mạng xã hội', 'Quảng cáo Google', 'Bạn bè giới thiệu', 'Website', 'Sự kiện/Hội thảo', 'Khác'][Math.floor(Math.random() * 6)] },
                { question_index: 1, value: 3 }, // Rating 3 (trung lập)
                { question_index: 2, value: [
                    'Một công ty công nghệ bình thường',
                    'Có nghe qua nhưng không rõ lắm về sản phẩm',
                    'Logo màu xanh, thiết kế khá ổn',
                    'Không có ấn tượng đặc biệt gì',
                    'Thương hiệu mới, chưa có nhiều thông tin',
                    'Nhớ có đọc review nhưng không nhớ nội dung',
                    'Có vẻ là công ty startup',
                    'Biết qua quảng cáo Facebook',
                    'Sản phẩm tương tự nhiều đối thủ khác',
                    'Chưa sử dụng nên khó đánh giá'
                ][i % 10] },
                { question_index: 3, value: ['Trung bình', 'Ít được biết đến', 'Top 3'][Math.floor(Math.random() * 3)] },
                { question_index: 4, value: [
                    'Cần tăng cường quảng cáo để nhiều người biết đến hơn',
                    'Nên có chương trình dùng thử miễn phí để trải nghiệm',
                    'Cải thiện nội dung trên website cho dễ hiểu hơn',
                    'Tham gia nhiều sự kiện hơn để tăng nhận diện',
                    'Có thể cân nhắc hợp tác với influencer',
                    'Tạo video hướng dẫn sử dụng sản phẩm',
                    'Cung cấp case study từ khách hàng thực tế',
                    'Đăng bài viết hữu ích trên blog thường xuyên hơn',
                    'Mở rộng kênh hỗ trợ khách hàng qua chat',
                    'Có chương trình giới thiệu với ưu đãi hấp dẫn',
                    'Thiết kế lại UI/UX cho hiện đại hơn',
                    'Cần có bảng giá rõ ràng trên website',
                    'Tổ chức webinar miễn phí để giới thiệu sản phẩm',
                    'Có phiên bản mobile app để tiện sử dụng',
                    'Tăng cường SEO để dễ tìm thấy trên Google',
                    'Cần testimonial từ khách hàng lớn',
                    'Cải thiện tốc độ phản hồi từ bộ phận support',
                    'Thêm tính năng comparison với đối thủ',
                    'Có demo trực tiếp với nhân viên tư vấn',
                    'Xây dựng community cho người dùng'
                ][i] }
            ],
            sentiment: 'neutral',
            respondent_index: i
        })),
        analysis_result: {
            analysis_type: 'sentiment',
            result_data: {
                summary: 'Phản hồi trung lập cho thấy thương hiệu cần tăng cường nhận diện và xây dựng USP rõ ràng hơn',
                overall_sentiment: 'neutral',
                sentiment_distribution: {
                    positive: 25,
                    neutral: 60,
                    negative: 15
                },
                key_observations: [
                    'Mức độ nhận biết thương hiệu còn thấp (chỉ 40% biết rõ)',
                    'Không có điểm khác biệt nổi bật so với đối thủ',
                    'Khách hàng khó mô tả được USP của thương hiệu',
                    'Cần cải thiện presence trên các kênh truyền thông'
                ],
                awareness_channels: {
                    'Mạng xã hội': 35,
                    'Quảng cáo Google': 25,
                    'Bạn bè giới thiệu': 20,
                    'Website': 10,
                    'Sự kiện/Hội thảo': 5,
                    'Khác': 5
                },
                recommendations: [
                    'Xây dựng USP (Unique Selling Proposition) rõ ràng',
                    'Tăng cường content marketing với case study thực tế',
                    'Đầu tư vào influencer marketing',
                    'Tổ chức các sự kiện networking để tăng brand awareness'
                ],
                category: 'marketing',
                analyzed_at: new Date().toISOString()
            }
        }
    }
};

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function seedData() {
    let connection;
    
    try {
        console.log('🔗 Connecting to MySQL on port', DB_CONFIG.port, '...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database:', DB_CONFIG.database);

        // Check if we already have seeded data
        const [existingSurveys] = await connection.execute(
            "SELECT COUNT(*) as count FROM surveys WHERE title LIKE '%Chất lượng Thực hành Lab%' OR title LIKE '%Mức độ hài lòng với Giá%' OR title LIKE '%Nhận diện Thương hiệu ALLMTAGS%'"
        );
        
        if (existingSurveys[0].count > 0) {
            console.log('⚠️  Multi-domain seed data already exists. Skipping...');
            console.log('   To reseed, delete existing surveys first.');
            return;
        }

        // Get or create a demo user
        let userId;
        const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
        if (users.length > 0) {
            userId = users[0].id;
        } else {
            // Create a demo user if none exists
            const [userResult] = await connection.execute(
                `INSERT INTO users (username, email, password, full_name, role, is_verified, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                ['ai_seed_admin', 'ai_seed@allmtags.com', '$2b$10$hashedpassword', 'AI Seed Admin', 'admin', 1]
            );
            userId = userResult.insertId;
        }
        console.log('👤 Using user ID:', userId);

        // Get question types
        const [questionTypes] = await connection.execute('SELECT id, name FROM question_types');
        const questionTypeMap = {};
        questionTypes.forEach(qt => questionTypeMap[qt.id] = qt.name);
        console.log('📋 Question types loaded:', Object.keys(questionTypeMap).length);

        // Seed each domain
        for (const [domain, data] of Object.entries(SEED_DATA)) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🏷️  SEEDING DOMAIN: ${domain.toUpperCase()}`);
            console.log(`${'='.repeat(60)}`);

            // 1. Create template
            const [templateResult] = await connection.execute(
                `INSERT INTO survey_templates (title, description, created_by, status, is_published, created_at, updated_at) 
                 VALUES (?, ?, ?, 'active', 1, NOW(), NOW())`,
                [data.template.title, data.template.description, userId]
            );
            const templateId = templateResult.insertId;
            console.log(`   ✅ Template created: ID ${templateId}`);

            // 2. Create survey
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            const [surveyResult] = await connection.execute(
                `INSERT INTO surveys (template_id, title, description, start_date, end_date, created_by, status, access_type, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, 'active', 'public', NOW(), NOW())`,
                [templateId, data.survey.title, data.survey.description, startDate, endDate, userId]
            );
            const surveyId = surveyResult.insertId;
            console.log(`   ✅ Survey created: ID ${surveyId} - "${data.survey.title}"`);

            // 3. Create questions
            const questionIds = [];
            for (let i = 0; i < data.questions.length; i++) {
                const q = data.questions[i];
                
                const [questionResult] = await connection.execute(
                    `INSERT INTO questions (template_id, survey_id, label, question_text, question_type_id, required, display_order, is_ai_generated) 
                     VALUES (?, ?, ?, ?, ?, 1, ?, 0)`,
                    [templateId, surveyId, q.label, q.question_text, q.question_type_id, i + 1]
                );
                const questionId = questionResult.insertId;
                questionIds.push(questionId);

                // Create options for multiple choice questions
                if (q.options) {
                    for (let j = 0; j < q.options.length; j++) {
                        await connection.execute(
                            `INSERT INTO question_options (question_id, option_text, display_order) VALUES (?, ?, ?)`,
                            [questionId, q.options[j], j + 1]
                        );
                    }
                }

                // Also add to generated_questions for AI context
                await connection.execute(
                    `INSERT INTO generated_questions (question_text, question_type, keyword, category, source_model, generated_by, quality_score, created_at) 
                     VALUES (?, ?, ?, ?, 'seed_data', ?, 0.85, NOW())`,
                    [q.question_text, questionTypeMap[q.question_type_id] || 'TEXT', q.keyword, q.category, userId]
                );
            }
            console.log(`   ✅ Questions created: ${questionIds.length} questions`);

            // 4. Create responses
            for (let i = 0; i < data.responses.length; i++) {
                const resp = data.responses[i];
                
                // Create survey response
                const [responseResult] = await connection.execute(
                    `INSERT INTO survey_responses (survey_id, respondent_id, is_complete, ip_address, started_at, submitted_at, created_at, updated_at) 
                     VALUES (?, NULL, 1, '192.168.1.${100 + i}', NOW(), NOW(), NOW(), NOW())`,
                    [surveyId]
                );
                const responseId = responseResult.insertId;

                // Create answers
                for (const answer of resp.answers) {
                    const questionId = questionIds[answer.question_index];
                    const answerValue = typeof answer.value === 'number' ? answer.value.toString() : answer.value;
                    
                    await connection.execute(
                        `INSERT INTO answers (survey_response_id, question_id, answer_text, created_at, updated_at) 
                         VALUES (?, ?, ?, NOW(), NOW())`,
                        [responseId, questionId, answerValue]
                    );
                }
            }
            console.log(`   ✅ Responses created: ${data.responses.length} responses (${data.responses[0].sentiment})`);

            // 5. Create analysis result
            await connection.execute(
                `INSERT INTO analysis_results (survey_id, analysis_type, result_data, generated_at) 
                 VALUES (?, ?, ?, NOW())`,
                [surveyId, data.analysis_result.analysis_type, JSON.stringify(data.analysis_result.result_data)]
            );
            console.log(`   ✅ Analysis result created: ${data.analysis_result.analysis_type}`);

            console.log(`\n   📊 Domain ${domain.toUpperCase()} Summary:`);
            console.log(`      - Survey: ${data.survey.title}`);
            console.log(`      - Questions: ${data.questions.length}`);
            console.log(`      - Responses: ${data.responses.length} (${data.responses[0].sentiment})`);
            console.log(`      - Category: ${data.survey.category}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 MULTI-DOMAIN SEED DATA COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\n📋 Summary:');
        console.log('   IT: 1 Survey + 5 Questions + 20 Negative Responses');
        console.log('   Sales: 1 Survey + 5 Questions + 20 Positive Responses');
        console.log('   Marketing: 1 Survey + 5 Questions + 20 Neutral Responses');
        console.log('   Analysis Results: 3 (one per domain)');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log('🚀 Starting Multi-Domain Smart Seeding Script...');
console.log(`📅 Date: ${new Date().toISOString()}`);
console.log(`🗄️  Database: ${DB_CONFIG.database} @ ${DB_CONFIG.host}:${DB_CONFIG.port}`);
console.log('');

seedData()
    .then(() => {
        console.log('\n✅ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    });
