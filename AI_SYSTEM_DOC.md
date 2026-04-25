 AI Intelligence System - Technical Documentation

Hệ thống AI được thiết kế để tự động hóa quy trình xây dựng biểu mẫu nghiên cứu (Survey/Assessment) dựa trên công nghệ RAG (Retrieval-Augmented Generation), cho phép AI phản hồi thông minh dựa trên cả tri thức cộng đồng và dữ liệu cá nhân.

---

 1. Luồng hoạt động của hệ thống (Workflow)

Hệ thống vận hành theo hai luồng chính tùy thuộc vào phạm vi dữ liệu (Scope):

 A. Luồng Global Intelligence (Tri thức cộng đồng)
Đây là chế độ sử dụng kho dữ liệu khổng lồ (các bản ghi nghiên cứu) để tạo ra các biểu mẫu chuẩn công nghiệp.
1.  Input: Người dùng nhập từ khóa (Keywords) hoặc chọn lĩnh vực (Domain).
2.  Retrieval: Hệ thống thực hiện Hybrid Search vào ChromaDB (Collection Global) để tìm các câu hỏi và cấu trúc tương tự đã thành công trong quá khứ.
3.  Synthesis: AI Agent đóng vai "Chuyên gia tư vấn" (Professional Consultant), kết hợp dữ liệu tìm được với kiến thức chuẩn của Gemini để tạo ra bản thảo chuyên nghiệp nhất.
4.  Output: Biểu mẫu đa dạng, phù hợp với tiêu chuẩn quốc tế.

 B. Luồng Personal Notebook (NotebookLM Style)
Đây là chế độ tập trung tuyệt đối vào tài liệu do người dùng nạp lên (PDF, URL, Text).
1.  Input: Người dùng chọn Workspace cá nhân và nhập yêu cầu.
2.  Strict Grounding: Hệ thống chỉ thực hiện tìm kiếm trong không gian dữ liệu riêng của Workspace đó (ChromaDB Collection Private).
3.  Synthesis: AI Agent đóng vai "Trợ lý học thuật" (Academic Examiner). Chỉ thị STRICT GROUNDING buộc AI phải trích xuất chính xác các thuật ngữ, tên riêng, và sự kiện có trong tài liệu của anh.
4.  Output: Các câu hỏi đào sâu vào nội dung tài liệu, độ chính xác cao (Fidelity).

---

 2. Công nghệ sử dụng (Tech Stack)

Hệ thống được xây dựng trên các công nghệ AI tiên tiến nhất hiện nay:

*   Ngôn ngữ chính: Python 3.10+ (FastAPI Framework) - Đảm bảo hiệu năng xử lý bất đồng bộ cao.
*   LLM (Large Language Model): Google Gemini 1.5 Flash - Tốc độ cực nhanh, hỗ trợ ngữ cảnh lớn (context window) lên đến 1 triệu tokens.
*   Vector Database: ChromaDB - Lưu trữ và truy vấn ngữ nghĩa (Semantic Search) siêu tốc.
*   Embedding Model: `all-MiniLM-L6-v2` - Chuyển đổi văn bản thành vector toán học để AI "hiểu" được ý nghĩa nội dung.
*   Communication: Giao thức RESTful API kết nối giữa Backend Node.js và AI Server Python.

---

 3. Cơ chế hoạt động (Mechanism)

 Quy trình Ingestion (Nạp dữ liệu)
- Tách đoạn (Chunking): Tài liệu được chia nhỏ thành các đoạn văn bản (300-500 ký tự) để AI dễ dàng truy xuất.
- Vectorization: Từng đoạn văn được "nhúng" (embed) thành các vector 384 chiều.
- Indexing: Lưu trữ vào ChromaDB kèm theo metadata (UserId, WorkspaceId, Category).

 Quy trình Generation (Sinh câu hỏi - The Intelligence Sequence)
1.  Phân tích ý đồ (Intent Analysis): AI đọc prompt của người dùng để xác định loại Form (Survey hay Quiz) và ngôn ngữ.
2.  Tìm kiếm ngữ cảnh (Context Retrieval): Dùng kỹ thuật Cosine Similarity để lấy ra Top-K đoạn văn bản liên quan nhất từ ChromaDB.
3.  Hợp nhất Prompt (Prompt Assembly): 
    - Nạp vai diễn (Role-playing).
    - Nạp ngữ cảnh (Grounded Context).
    - Nạp quy tắc định dạng (JSON Schema).
4.  Hậu xử lý (Post-processing): Kiểm tra tính hợp lệ của JSON, làm sạch dữ liệu và trả về cho Frontend.

---

 4. Tóm tắt đặc điểm nổi bật
- Bảo mật: Dữ liệu Personal Workspace được cô lập hoàn toàn, không rò rỉ ra Global.
- Tính chính xác: Có cơ chế tính toán độ tin cậy (Fidelity Score) cho từng câu hỏi sinh ra.
- Tốc độ: Tối ưu hóa Timeout và xử lý nền để đảm bảo trải nghiệm người dùng mượt mà.
