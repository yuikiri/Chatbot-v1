# Bài 01: Giải Thích Vỡ Lòng về Vector, Embedding và Cơ Sở Dữ Liệu

## 1. Vector và Embedding là gì?

Nhiều người mới nghe từ "Vector Database" thường nghĩ đến toán hình học không gian phức tạp. Nhưng trong lập trình AI, bản chất của nó lại vô cùng tự nhiên và trực quan.

### Ẩn dụ về Tọa độ GPS
Hãy tưởng tượng bạn có một tấm bản đồ thế giới:
* Thủ đô Hà Nội có tọa độ: `[Vĩ độ: 21.0285, Kinh độ: 105.8542]`
* Thành phố Hải Phòng có tọa độ: `[Vĩ độ: 20.8449, Kinh độ: 106.6881]`
* Thành phố Paris (Pháp) có tọa độ: `[Vĩ độ: 48.8566, Kinh độ: 2.3522]`

Chỉ cần nhìn vào 2 con số tọa độ, máy tính có thể tính ngay: Hà Nội và Hải Phòng **nằm rất gần nhau**, còn Paris thì **nằm rất xa**.

### Embedding: Tọa độ hóa ý nghĩa của câu chữ
Con người hiểu ý nghĩa câu nói, nhưng máy tính thì chỉ hiểu số. Vì vậy, các nhà khoa học tạo ra các mô hình chuyển đổi văn bản thành một danh sách các con số (gọi là **Vector Embedding**).
* Đoạn văn: *"Thuốc hạ sốt giảm đau cho mẹ"* $\rightarrow$ chuyển thành: `[0.12, -0.85, 0.43, ..., 0.91]` (thường có 1536 con số tọa độ).
* Đoạn văn: *"Uống gì khi bị sốt cao đau đầu"* $\rightarrow$ chuyển thành: `[0.11, -0.82, 0.41, ..., 0.89]`
* Đoạn văn: *"Cách làm bánh pizza"* $\rightarrow$ chuyển thành: `[-0.78, 0.32, -0.15, ..., -0.54]`

Khi so sánh các con số này:
* Hai câu về "sốt" và "thuốc" có dãy số **gần như giống hệt nhau** (nằm sát nhau trên bản đồ ý nghĩa).
* Câu về "bánh pizza" có dãy số **hoàn toàn khác biệt** (nằm ở một góc xa xôi khác).

Quá trình biến chữ thành dãy số này gọi là **Embedding**.

---

## 2. Tìm kiếm truyền thống (Keyword Search) vs Tìm kiếm ngữ nghĩa (Vector Search)

| Đặc điểm | Tìm kiếm theo từ khóa (SQL truyền thống) | Tìm kiếm ngữ nghĩa (Vector Search) |
| :--- | :--- | :--- |
| **Cách thức** | Khớp từng chữ cái chính xác (Giống như `Ctrl + F`). | So sánh khoảng cách ý nghĩa (Tọa độ). |
| **Ưu điểm** | Cực kỳ chính xác khi người dùng gõ đúng tên thuốc (ví dụ: gõ "Paracetamol"). | Hiểu được ngữ cảnh ngay cả khi người dùng không biết tên thuốc. |
| **Nhược điểm** | Thất bại nếu người dùng gõ sai chính tả hoặc hỏi theo triệu chứng. | Đôi khi tìm ra đoạn có nghĩa gần gần nhưng không phải hoạt chất cụ thể nếu prompt không chặt. |
| **Ví dụ thực tế** | Người mẹ hỏi: *"Bé bú mẹ mà em bị đau nửa đầu thì làm sao?"* $\rightarrow$ **SQL không tìm thấy** vì trong sách chỉ có từ "giảm đau". | Máy tính hiểu "đau nửa đầu" nằm sát với "thuốc giảm đau" $\rightarrow$ **Tìm ra ngay Paracetamol**. |

**Giải pháp của chúng ta:** Sử dụng **Hybrid Search** (Tìm kiếm kết hợp):
1. Trước tiên tìm theo tên thuốc người dùng gõ (nếu có).
2. Sau đó kết hợp quét vector theo ý nghĩa câu hỏi để không bao giờ bỏ sót tài liệu.

---

## 3. Cosine Similarity là gì? (Cách máy tính đo độ giống nhau)

Khi có 2 vector (2 mũi tên trong không gian), máy tính dùng công thức toán học gọi là **Cosine Similarity (Độ tương đồng Cosine)** để đo góc giữa 2 mũi tên:
* Kết quả bằng **1.0**: Hai câu có ý nghĩa giống hệt nhau 100%.
* Kết quả từ **0.7 đến 0.9**: Hai câu rất liên quan mật thiết với nhau.
* Kết quả nhỏ hơn **0.3**: Hoàn toàn không liên quan gì đến nhau.

Khi người dùng hỏi một câu, hệ thống tính Cosine Similarity giữa câu hỏi đó với toàn bộ các đoạn sách y văn trong kho, rồi bốc ra **Top 3 đoạn có điểm số cao nhất** để đưa cho AI đọc.

---

## 4. Tại sao dự án của bạn KHÔNG CẦN cài đặt Vector Database phức tạp?

Hiện nay trên mạng thường khuyên dùng các Vector Database lớn như: *ChromaDB, Pinecone, Weaviate, Milvus, Qdrant*.

Tuy nhiên, với bài toán đề tài của bạn:
* Bạn có khoảng **50 đến 200 loại thuốc**, chia nhỏ ra thành khoảng **500 đến 1.000 đoạn văn ngắn**.
* 1.000 đoạn vector này chỉ nặng chưa tới **5 Megabyte** (nhẹ hơn một bài hát MP3).
* Nếu dùng thư viện toán học cơ bản `numpy` của Python, máy tính tính toán khoảng cách của 1.000 vector này chỉ mất **0.001 giây (1 phần nghìn giây)** trực tiếp trên bộ nhớ RAM!

### So sánh lựa chọn:
1. **Dùng Vector DB đám mây (Pinecone, Qdrant Cloud):** Phải tạo tài khoản, lấy API key, phụ thuộc vào đường truyền mạng quốc tế, có nguy cơ hết lượt miễn phí.
2. **Dùng Vector DB cài đặt (ChromaDB cục bộ):** Nặng nề, yêu cầu thư viện C++ phức tạp, dễ làm sập máy chủ Render (gói miễn phí chỉ có 512MB RAM).
3. **Dùng Numpy thuần trong bộ nhớ (Phương án của chúng ta):**
   * Hoàn toàn miễn phí, siêu nhẹ (~20MB RAM).
   * Không bao giờ bị lỗi cài đặt trên Render.
   * Tốc độ cực nhanh, đọc file trực tiếp trong thư mục dự án.

---

## 5. Tóm lược cơ chế lưu trữ của toàn bộ ứng dụng

Để bạn dễ hình dung, hệ thống phân chia rõ ràng 3 nhiệm vụ:
1. **Google Firebase:** Lưu tài khoản người dùng và lưu các tin nhắn chat cũ (để hiện bên cột trái như ChatGPT).
2. **Thư mục `Data/documents/`:** Chứa các bài viết thông tin thuốc dạng chữ (.txt/.md) do bạn biên soạn.
3. **Mảng Vector trong RAM (Numpy):** Giúp máy tính tìm kiếm siêu nhanh đoạn tài liệu liên quan nhất với câu hỏi người dùng.
