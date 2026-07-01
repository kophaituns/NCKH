# AI Intelligence System (Modular RAG Form API)

Technical documentation for the AI Service inside **SIR-AG Platform** (Scientific Intelligent Retrieval & AI Generation). This project uses RAG (Retrieval-Augmented Generation) with Google Gemini and ChromaDB to dynamically generate surveys, quizzes, and forms based on global knowledge or private user notebooks.

---

## 1. Kiến Trúc Hệ Thống (System Architecture)

Sơ đồ hoạt động của hệ thống RAG kết hợp đa tài liệu (Multi-tenant Notebook RAG):

```mermaid
graph TD
    User([User Prompt / Keywords]) --> API[FastAPI Server]
    API -->|Intent Analysis| Agent[Gemini AI Agent]
    
    subgraph Knowledge Retrieval (RAG)
        Chroma[(ChromaDB Server)]
        Chroma -->|1. Global Knowledge| Retrieval[Vector Similarity Search]
        Chroma -->|2. Workspace Notebooks| Retrieval
    end
    
    API -->|Query| Retrieval
    Retrieval -->|Relevant Chunks| Agent
    Agent -->|Structured Synthesis| Form[JSON Form Output]
```

---

## 2. Công Nghệ Sử Dụng (Technology Stack)

*   **FastAPI:** Framework web Python bất đồng bộ (async), hiệu năng cao, tự động sinh tài liệu Swagger UI.
*   **Google Gemini 1.5 Flash:** LLM chính đảm nhiệm phân tích ý định (Intent Analysis) và sinh câu hỏi (Form Generation). Flash được tối ưu hóa cho tốc độ phản hồi nhanh (< 3s) và context window cực lớn (1M tokens).
*   **ChromaDB (v0.4.24):** Cơ sở dữ liệu Vector lưu trữ dữ liệu tri thức được nhúng. Hỗ trợ cách ly dữ liệu đa người dùng (Multi-tenant) qua cơ chế đặt tên collection (`workspace_{id}`).
*   **Sentence-Transformers (`all-MiniLM-L6-v2`):** Model cục bộ dùng để chuyển văn bản thành vector nhúng 384 chiều, đảm bảo tốc độ tính toán nhanh mà không tốn phí API bên thứ ba.
*   **Uvicorn:** ASGI Server chạy Python web app.

---

## 3. Cấu Chỉ Docker & ChromaDB

Hệ thống AI sử dụng ChromaDB chạy dưới dạng Docker Container để cô lập dữ liệu lưu trữ và tối ưu tài nguyên.

### File cấu hình `docker-compose.yml` (nằm ở thư mục `Docker/docker-compose.yml`):
```yaml
  chromadb:
    image: chromadb/chroma:latest
    container_name: chroma-db
    restart: always
    environment:
      - IS_PERSISTENT=TRUE
      - PERSIST_DIRECTORY=/data
    ports:
      - "8003:8000"  # Ánh xạ cổng 8000 của container ra cổng 8003 của máy host
    volumes:
      - ../form-agent-AI-project/chroma_db:/data  # Mount dữ liệu ra thư mục dự án Python
    networks:
      - llm-survey-network
```

> [!IMPORTANT]
> **Lưu ý về Cổng kết nối (Port Mapping):**
> *   **ChromaDB Container** chạy trên cổng mặc định `8000` của Docker, nhưng được ánh xạ ra cổng máy ngoài (host) là **`8003`** để tránh xung đột với các dịch vụ cục bộ khác.
> *   AI Python Service chạy độc lập bên ngoài Docker cần kết nối đến ChromaDB qua `http://localhost:8003`.

---

## 4. Hướng Dẫn Cài Đặt Chi Tiết Khi Clone Code

Khi tải dự án về máy lần đầu, hãy thực hiện tuần tự các bước dưới đây bằng Terminal:

### Bước 1: Khởi động Docker Database
Di chuyển vào thư mục Docker của dự án và khởi chạy các container cần thiết (MySQL, phpMyAdmin, ChromaDB):
```bash
# Di chuyển tới thư mục Docker
cd d:/NCKH/Docker

# Khởi chạy Docker Compose ở chế độ chạy ngầm (-d)
docker compose up -d
```
> Kiểm tra các container đang hoạt động bằng lệnh: `docker ps`

### Bước 2: Thiết lập môi trường ảo Python (Virtual Environment)
Di chuyển vào thư mục dự án AI và tạo môi trường ảo Python nhằm tránh xung đột thư viện hệ thống:
```bash
# Di chuyển vào thư mục dự án AI
cd d:/NCKH/form-agent-AI-project

# Khởi tạo môi trường ảo đặt tên là .venv
python -m venv .venv
```

### Bước 3: Kích hoạt môi trường ảo
Tùy thuộc vào Hệ điều hành bạn đang sử dụng, hãy chạy lệnh tương ứng:

*   **Trên Windows (PowerShell):**
    ```powershell
    .\.venv\Scripts\Activate.ps1
    ```
*   **Trên Windows (CMD):**
    ```cmd
    .\.venv\Scripts\activate.bat
    ```
*   **Trên macOS / Linux (bash/zsh):**
    ```bash
    source .venv/bin/activate
    ```
*(Khi kích hoạt thành công, bạn sẽ thấy ký tự `(.venv)` xuất hiện ở đầu dòng Terminal)*

### Bước 4: Cài đặt các thư viện cần thiết (Dependencies)
```bash
# Nâng cấp pip lên bản mới nhất
python -m pip install --upgrade pip

# Cài đặt toàn bộ thư viện từ requirements.txt
pip install -r requirements.txt
```

### Bước 5: Cấu hình file `.env`
Tạo file `.env` trong thư mục `form-agent-AI-project/` và cấu hình các khóa cần thiết:
```env
# API Keys (Điền mã khóa Gemini của bạn vào đây)
GEMINI_API_KEY=your_gemini_api_key_here

# Cấu hình kết nối tới Vector DB (ChromaDB chạy qua Docker)
CHROMA_HOST=localhost
CHROMA_PORT=8003

# Cấu hình cổng chạy AI Service
HOST=0.0.0.0
PORT=8001
```

### Bước 6: Khởi chạy AI Service
Khởi chạy dịch vụ FastAPI bằng Uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```
*   `--reload`: Tự động tải lại code khi phát hiện thay đổi (rất hữu ích khi phát triển).
*   `--port 8001`: Định danh dịch vụ AI chạy trên cổng `8001`.

---

## 5. Xác Minh Hoạt Động (Verification)

Sau khi khởi chạy, bạn có thể kiểm tra xem dịch vụ AI và database đã thông suốt chưa bằng cách truy cập:

1.  **Swagger UI (Tài liệu API):** Mở trình duyệt truy cập `http://localhost:8001/docs` để kiểm thử trực quan các endpoint.
2.  **Health Check Endpoint:** Gửi request kiểm tra trạng thái:
    *   **Lệnh Terminal (PowerShell):**
        ```powershell
        Invoke-RestMethod -Uri http://localhost:8001/
        ```
    *   **Kết quả mong muốn:**
        ```json
        {
          "status": "online",
          "mode": "NotebookLM Multi-tenant",
          "gemini_ready": true,
          "chroma_connected": true
        }
        ```
        *(Hãy đảm bảo cả `gemini_ready` và `chroma_connected` đều trả về `true`)*
