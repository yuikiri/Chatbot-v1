# Chuẩn Cấu trúc Dữ liệu Hoạt chất (Drug Monograph Schema)

Tài liệu này quy định định dạng dữ liệu chuẩn cho từng hồ sơ thuốc trong cơ sở dữ liệu y văn của Chatbot_v1, mô phỏng theo chuẩn phân loại của cơ sở dữ liệu **LactMed** (National Library of Medicine - NIH).

---

## 1. Cấu trúc Tệp Dữ liệu (JSON Monograph)

Mỗi hoạt chất được lưu trữ dưới dạng một đối tượng JSON độc lập (hoặc file Markdown có Frontmatter tương đương):

```json
{
  "drug_id": "MED-001",
  "generic_name": "Paracetamol",
  "brand_names": ["Hapacol", "Panadol", "Efferalgan", "Tylenol"],
  "drug_class": "Thuốc giảm đau, hạ sốt (Analgesics / Antipyretics)",
  "lactation_safety_level": "Compatible", // Compatible | Caution | Contraindicated | Unknown
  "summary_vietnamese": "Paracetamol là thuốc giảm đau, hạ sốt được lựa chọn hàng đầu cho phụ nữ đang cho con bú. Lượng thuốc bài tiết vào sữa mẹ rất thấp (dưới 2% liều dùng của mẹ) và không ghi nhận tác dụng phụ đáng kể ở trẻ sơ sinh bú mẹ khi dùng liều điều trị thông thường.",
  "pharmacokinetics": {
    "relative_infant_dose": "0.1% - 2.0%",
    "peak_milk_level_time": "1 - 2 giờ sau khi uống",
    "half_life_hours": 2.5
  },
  "effects_on_infants": "Hiếm gặp. Chưa có báo cáo nào về tác dụng phụ nghiêm trọng khi người mẹ dùng liều thông thường. Cần theo dõi các biểu hiện phát ban hoặc rối loạn tiêu hóa nhẹ.",
  "recommended_alternatives": [],
  "contraindications_and_warnings": "Tránh dùng phối hợp với các thuốc cảm cúm hỗn hợp có chứa thêm hoạt chất co mạch (Pseudoephedrine, Phenylephrine) hoặc kháng histamin thế hệ 1 liều cao vì có thể gây giảm tiết sữa.",
  "verified_sources": [
    {
      "source_name": "LactMed (NCBI/NLM)",
      "last_revised": "2024-05-15",
      "reference_url": "https://www.ncbi.nlm.nih.gov/books/NBK501922/"
    },
    {
      "source_name": "Dược thư Quốc gia Việt Nam",
      "edition": "2022"
    }
  ]
}
```

---

## 2. Thang Phân loại An toàn (Safety Taxonomy)

Hệ thống bắt buộc gắn nhãn hoạt chất theo 4 mức độ rõ ràng:

| Mức độ | Định nghĩa | Hành vi ứng xử của Bot |
| :--- | :--- | :--- |
| **Compatible (Tương thích / An toàn)** | Bằng chứng lâm sàng xác nhận nồng độ trong sữa rất thấp, an toàn cho trẻ bú mẹ. | Xác nhận an toàn, nêu liều điều trị thông thường và thời điểm cho bú an toàn nhất (sau khi uống thuốc). |
| **Caution (Thận trọng)** | Thuốc bài tiết qua sữa hoặc có nguy cơ gây tác dụng phụ nhẹ; cần cân nhắc lợi ích/nguy cơ. | Cảnh báo rõ ràng các dấu hiệu cần theo dõi ở trẻ (buồn ngủ, bỏ bú, tiêu chảy); yêu cầu dùng liều thấp nhất trong thời gian ngắn nhất. |
| **Contraindicated (Chống chỉ định)** | Nguy cơ ngộ độc cao hoặc ức chế tiết sữa nghiêm trọng (ví dụ: thuốc hóa trị, thuốc phóng xạ, dẫn xuất ergot). | **Cảnh báo khẩn cấp màu đỏ:** Khuyên ngừng cho con bú hoặc đổi thuốc; bắt buộc chỉ định của bác sĩ. |
| **Unknown (Chưa đủ dữ liệu)** | Chưa có nghiên cứu lâm sàng đầy đủ về nồng độ trong sữa mẹ. | **Từ chối kết luận:** Nêu rõ y văn chưa đủ bằng chứng an toàn và khuyên dùng thuốc thay thế đã được kiểm chứng. |
