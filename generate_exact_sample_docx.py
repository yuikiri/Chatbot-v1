import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import re, os, glob

def set_cell_border(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)

def set_cell_margins(cell, top=80, bottom=80, left=110, right=110):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_footer_field(section, num_fmt=None, start_num=None):
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    pPr = p._p.get_or_add_pPr()
    
    # Configure page numbering format in sectPr
    sectPr = section._sectPr
    # remove existing pgNumType if any
    for el in sectPr.findall(qn('w:pgNumType')):
        sectPr.remove(el)
    
    pgNumType = OxmlElement('w:pgNumType')
    if num_fmt:
        pgNumType.set(qn('w:fmt'), num_fmt)
    if start_num is not None:
        pgNumType.set(qn('w:start'), str(start_num))
    sectPr.append(pgNumType)

    # Add PAGE field
    p.text = ""
    run = p.add_run()
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(0, 0, 0)

def add_toc_line(doc, text, page_str, is_bold=False, is_italic=False, indent_in=0.0):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.25
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.first_line_indent = Inches(0)
    if indent_in > 0:
        p.paragraph_format.left_indent = Inches(indent_in)
    
    # Add tab stop at 9350 dxa (right aligned with dot leader)
    pPr = p._p.get_or_add_pPr()
    tabs = parse_xml(r'<w:tabs %s><w:tab w:val="right" w:leader="dot" w:pos="9350"/></w:tabs>' % nsdecls('w'))
    pPr.append(tabs)

    run1 = p.add_run(text)
    run1.font.name = 'Times New Roman'
    run1.font.size = Pt(12)
    run1.font.color.rgb = RGBColor(0, 0, 0)
    run1.bold = is_bold
    run1.italic = is_italic

    run2 = p.add_run(f"\t{page_str}")
    run2.font.name = 'Times New Roman'
    run2.font.size = Pt(12)
    run2.font.color.rgb = RGBColor(0, 0, 0)
    run2.bold = is_bold

def append_section_markdown(doc, md_text):
    lines = md_text.split('\n')
    in_table = False
    table_rows = []
    in_code = False
    code_lines = []

    def flush_table():
        nonlocal in_table, table_rows
        if in_table and table_rows:
            num_cols = max(len(r) for r in table_rows)
            t = doc.add_table(rows=len(table_rows), cols=num_cols)
            t.alignment = WD_TABLE_ALIGNMENT.CENTER
            for r_idx, row in enumerate(table_rows):
                is_header = (r_idx == 0)
                for c_idx in range(num_cols):
                    val = row[c_idx] if c_idx < len(row) else ''
                    val = re.sub(r'\*\*(.*?)\*\*', r'\1', val)
                    val = re.sub(r'\*(.*?)\*', r'\1', val)
                    cell = t.cell(r_idx, c_idx)
                    cell.text = val
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_after = Pt(2)
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.line_spacing = 1.15
                    run = p.runs[0] if p.runs else p.add_run(val)
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(10)
                    run.font.color.rgb = RGBColor(0, 0, 0)
                    if is_header:
                        run.bold = True
                    set_cell_border(cell)
                    set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            doc.add_paragraph()
            in_table = False
            table_rows = []

    for line in lines:
        stripped = line.strip()

        if stripped.startswith('```'):
            if in_code:
                in_code = False
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.3)
                p.paragraph_format.space_after = Pt(4)
                run = p.add_run('\n'.join(code_lines))
                run.font.name = 'Courier New'
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(0, 0, 0)
                code_lines = []
            else:
                flush_table()
                in_code = True
                code_lines = []
            continue

        if in_code:
            code_lines.append(line)
            continue

        if stripped.startswith('|') and stripped.endswith('|'):
            if re.match(r'^\|[\s\-:|]+\|$', stripped):
                continue
            cells = [c.strip() for c in stripped.strip('|').split('|')]
            table_rows.append(cells)
            in_table = True
            continue
        else:
            flush_table()

        if not stripped:
            continue

        if stripped.startswith('# '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(stripped[2:])
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(14)
            run.font.color.rgb = RGBColor(0, 0, 0)
        elif stripped.startswith('## '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(stripped[3:])
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(13)
            run.font.color.rgb = RGBColor(0, 0, 0)
        elif stripped.startswith('### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(stripped[4:])
            run.bold = True
            run.italic = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(13)
            run.font.color.rgb = RGBColor(0, 0, 0)
        elif stripped.startswith('- ') or stripped.startswith('* '):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.35
            text = stripped[2:]
            parts = re.split(r'(\*\*.*?\*\*)', text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.bold = True
                else:
                    r = p.add_run(part)
                r.font.name = 'Times New Roman'
                r.font.size = Pt(13)
                r.font.color.rgb = RGBColor(0, 0, 0)
        elif stripped.startswith('---'):
            continue
        else:
            p = doc.add_paragraph()
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.35
            parts = re.split(r'(\*\*.*?\*\*|\*.*?\*)', stripped)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.bold = True
                elif part.startswith('*') and part.endswith('*'):
                    r = p.add_run(part[1:-1])
                    r.italic = True
                else:
                    r = p.add_run(part)
                r.font.name = 'Times New Roman'
                r.font.size = Pt(13)
                r.font.color.rgb = RGBColor(0, 0, 0)
    flush_table()

def generate_master_final_report():
    output_docx = 'Docs/Report/final/Bao_Cao_De_Tai_67_Full_Final.docx'
    print(f"Generating exact sample formatted report: {output_docx}...")

    doc = docx.Document()

    # Normal style setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(13)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.35
    normal_style.paragraph_format.space_after = Pt(4)

    # ============================================================
    # SECTION 0: BÌA CHUẨN (COVER PAGE)
    # ============================================================
    sec0 = doc.sections[0]
    sec0.page_width = Inches(8.5)
    sec0.page_height = Inches(11.0)
    sec0.top_margin = Inches(1.0)
    sec0.bottom_margin = Inches(1.0)
    sec0.left_margin = Inches(1.0)
    sec0.right_margin = Inches(1.0)

    # Add single thin line border on first page
    sectPr0 = sec0._sectPr
    pgBorders = parse_xml(
        f'<w:pgBorders {nsdecls("w")} w:display="firstPage" w:offsetFrom="page">'
        f'<w:top w:val="basicThinLines" w:sz="6" w:space="24" w:color="auto"/>'
        f'<w:left w:val="basicThinLines" w:sz="6" w:space="24" w:color="auto"/>'
        f'<w:bottom w:val="basicThinLines" w:sz="6" w:space="24" w:color="auto"/>'
        f'<w:right w:val="basicThinLines" w:sz="6" w:space="24" w:color="auto"/>'
        f'</w:pgBorders>'
    )
    sectPr0.append(pgBorders)

    # Cover Page Content
    p0 = doc.add_paragraph()
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(36)
    r = p0.add_run('BỘ GIÁO DỤC VÀ ĐÀO TẠO')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(0, 0, 0)

    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.space_after = Pt(72)
    r = p1.add_run('BÁO CÁO HỌC PHẦN NĂNG LỰC SỐ')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(12)
    r = p_title.add_run('CHATBOT AI TƯ VẤN SỬ DỤNG\nTHUỐC CHO PHỤ NỮ CHO CON BÚ')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(20.5)
    r.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(90)
    r = p_sub.add_run('Nghiên cứu trường hợp LactaMed AI và xây dựng hệ thống tra cứu an toàn sữa mẹ theo chuẩn LactMed NIH')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12.5)
    r.italic = True
    r.font.color.rgb = RGBColor(0, 0, 0)

    # Metadata block
    meta_lines = [
        "           Sinh viên thực hiện: HUỲNH TẤN LỘC",
        "           Mã số sinh viên: 2313030143",
        "           Lớp / Nhóm: KD23QĐV-DH2",
        "           Giảng viên hướng dẫn: MAI THANH TÂM"
    ]
    for ml in meta_lines:
        p_m = doc.add_paragraph()
        p_m.paragraph_format.space_after = Pt(2)
        p_m.paragraph_format.line_spacing = 1.2
        r = p_m.add_run(ml)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12.5)
        r.font.color.rgb = RGBColor(0, 0, 0)

    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_loc.paragraph_format.space_before = Pt(100)
    r = p_loc.add_run('Thành phố Hồ Chí Minh, tháng 11 năm 2026')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12.5)
    r.italic = True
    r.font.color.rgb = RGBColor(0, 0, 0)

    # ============================================================
    # SECTION 1: PHẦN ĐẦU (FRONT MATTER - TÓM TẮT, CHỮ VIẾT TẮT, MỤC LỤC, DANH MỤC BẢNG)
    # Numbering: lowerRoman (i, ii, iii...) right-aligned footer
    # ============================================================
    sec1 = doc.add_section(docx.enum.section.WD_SECTION.NEW_PAGE)
    sec1.page_width = Inches(8.5)
    sec1.page_height = Inches(11.0)
    sec1.top_margin = Inches(1.0)
    sec1.bottom_margin = Inches(1.0)
    sec1.left_margin = Inches(1.0)
    sec1.right_margin = Inches(1.0)
    add_footer_field(sec1, num_fmt="lowerRoman", start_num=1)

    # TÓM TẮT
    p_tt = doc.add_paragraph()
    p_tt.paragraph_format.space_before = Pt(14)
    p_tt.paragraph_format.space_after = Pt(8)
    r = p_tt.add_run('TÓM TẮT')
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)

    tt_body = [
        "Báo cáo nghiên cứu khả năng sử dụng chatbot AI để hỗ trợ tư vấn sử dụng thuốc an toàn cho phụ nữ đang nuôi con bằng sữa mẹ, tập trung vào tính chuẩn xác của dữ liệu y văn, nồng độ bài tiết của dược chất vào sữa mẹ, liều tương đối của trẻ bú mẹ (Relative Infant Dose - RID), tỷ lệ nồng độ thuốc trong sữa so với huyết tương mẹ (L/P ratio), và ranh giới giữa giáo dục sức khỏe số với quyết định điều trị lâm sàng. Trường hợp khảo sát là mô hình trợ lý LactaMed AI, nơi giới thiệu công cụ tra cứu mức độ an toàn theo bốn cấp bậc y văn, bóc tách hoạt chất, cảnh báo chống chỉ định thời kỳ cho con bú, hướng dẫn thời điểm uống thuốc sau cữ bú và theo dõi các triệu chứng bất lợi ở trẻ.",
        "Phương pháp nghiên cứu gồm tổng quan tài liệu từ Thư viện Dược lý Lâm sàng Hoa Kỳ (LactMed® NIH), Hiệp hội Quốc tế APILAM (e-lactancia), Viện Hàn lâm Nhi khoa Hoa Kỳ (AAP), Tổ chức Y tế Thế giới (WHO), Cục Quản lý Thực phẩm và Dược phẩm Hoa Kỳ (FDA) và Dược thư Quốc gia Việt Nam; xây dựng 15 tình huống lâm sàng mô phỏng các vấn đề sử dụng thuốc phổ biến nhất ở phụ nữ cho con bú (hạ sốt, giảm đau, kháng sinh, dị ứng, cảm cúm, kích sữa, ngừa thai sau sinh, nấm phụ khoa, nứt cổ gà...); phân tích dược động học bài tiết (RID, L/P ratio); đối chiếu chức năng của LactaMed AI với kiến trúc chatbot an toàn; đề xuất prompt y khoa tham chiếu, bộ kiểm thử 15 tình huống và phiếu chấm chất lượng tư vấn y tế.",
        "Kết quả nghiên cứu cho thấy cần tách biệt cơ sở tri thức y văn đã được kiểm duyệt (LactMed, Dược thư QG) khỏi năng lực tạo sinh ngôn ngữ của AI; ưu tiên nhận diện chống chỉ định tuyệt đối (Aspirin liều cao gây hội chứng Reye, Estrogen gây tiêu sữa, Corticoid nuốt phải gây suy thượng thận); nghiêm cấm sử dụng câu trả lời của chatbot làm căn cứ tự ý ngưng thuốc kê đơn hoặc cai sữa sớm; dẫn nguồn khớp từng khẳng định lâm sàng; công khai cảnh báo khi y văn thiếu dữ liệu; và bảo vệ dữ liệu sức khỏe cá nhân theo Nghị định 13/2023/NĐ-CP. Báo cáo kết luận Chatbot AI có tiềm năng to lớn hỗ trợ người mẹ an tâm duy trì nguồn sữa mẹ quý giá và giúp sinh viên Dược nâng cao năng lực tư vấn dược lâm sàng, nhưng chỉ có thể phát huy giá trị an toàn dưới sự giám sát và thẩm định chuyên môn của nhân viên y tế có chứng chỉ hành nghề."
    ]
    for b in tt_body:
        p = doc.add_paragraph()
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.35
        r = p.add_run(b)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)

    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.space_before = Pt(6)
    p_kw.paragraph_format.space_after = Pt(18)
    r = p_kw.add_run('Từ khóa: ')
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r2 = p_kw.add_run('Chatbot AI; tư vấn sử dụng thuốc; phụ nữ cho con bú; an toàn sữa mẹ; LactaMed AI; LactMed® NIH; RID; L/P ratio; APILAM; Dược thư Quốc gia; an toàn số.')
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(13)

    # DANH MỤC CHỮ VIẾT TẮT
    doc.add_page_break()
    p_abbr = doc.add_paragraph()
    p_abbr.paragraph_format.space_before = Pt(14)
    p_abbr.paragraph_format.space_after = Pt(8)
    r = p_abbr.add_run('DANH MỤC CHỮ VIẾT TẮT')
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)

    abbr_data = [
        ("AAP", "American Academy of Pediatrics (Viện Hàn lâm Nhi khoa Hoa Kỳ)"),
        ("ADR", "Adverse Drug Reaction (Phản ứng có hại của thuốc / Biến cố bất lợi)"),
        ("AI", "Artificial Intelligence (Trí tuệ nhân tạo)"),
        ("APILAM", "Association for Promotion of and Research into Breastfeeding (Hiệp hội APILAM / e-lactancia)"),
        ("BYT", "Bộ Y tế Việt Nam"),
        ("CDSS", "Clinical Decision Support System (Hệ thống hỗ trợ ra quyết định lâm sàng)"),
        ("CRAAP", "Currency, Relevance, Authority, Accuracy, Purpose (Mô hình đánh giá nguồn tin)"),
        ("DSR", "Design Science Research (Phương pháp nghiên cứu thiết kế khoa học)"),
        ("Dược thư QG", "Dược thư Quốc gia Việt Nam"),
        ("FDA", "Food and Drug Administration (Cơ quan Quản lý Thực phẩm và Dược phẩm Hoa Kỳ)"),
        ("L/P ratio", "Milk-to-Plasma ratio (Tỷ lệ nồng độ thuốc trong sữa / huyết tương mẹ)"),
        ("LactMed", "Drugs and Lactation Database (Cơ sở dữ liệu Thuốc và Cho con bú - NIH Hoa Kỳ)"),
        ("LLM", "Large Language Model (Mô hình ngôn ngữ lớn)"),
        ("MeSH", "Medical Subject Headings (Tiêu đề đề mục y học chuẩn quốc tế)"),
        ("NER", "Named Entity Recognition (Nhận diện thực thể định danh y dược)"),
        ("OTC", "Over The Counter (Thuốc không kê đơn)"),
        ("RAG", "Retrieval-Augmented Generation (Tăng cường truy xuất dữ liệu tham chiếu)"),
        ("RCT", "Randomized Controlled Trial (Thử nghiệm lâm sàng ngẫu nhiên có đối chứng)"),
        ("RID", "Relative Infant Dose (Liều tương đối của trẻ bú mẹ so với liều mẹ)"),
        ("SaMD", "Software as a Medical Device (Phần mềm giữ vai trò thiết bị y tế)"),
        ("SIFT", "Stop, Investigate the source, Find better coverage, Trace claims (Phương pháp đọc ngang)"),
        ("WHO", "World Health Organization (Tổ chức Y tế Thế giới)")
    ]

    t_abbr = doc.add_table(rows=len(abbr_data)+1, cols=2)
    t_abbr.alignment = WD_TABLE_ALIGNMENT.CENTER
    # header
    t_abbr.cell(0, 0).text = "Ký hiệu"
    t_abbr.cell(0, 1).text = "Giải thích đầy đủ"
    for c in range(2):
        cell = t_abbr.cell(0, c)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.runs[0]
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10.5)
        r.bold = True
        set_cell_border(cell)
        set_cell_margins(cell, 60, 60, 100, 100)
    for idx, (k, v) in enumerate(abbr_data):
        row = idx + 1
        c0 = t_abbr.cell(row, 0)
        c0.text = k
        p0 = c0.paragraphs[0]
        p0.runs[0].font.name = 'Times New Roman'
        p0.runs[0].font.size = Pt(10)
        p0.runs[0].bold = True
        set_cell_border(c0)
        set_cell_margins(c0, 50, 50, 100, 100)

        c1 = t_abbr.cell(row, 1)
        c1.text = v
        p1 = c1.paragraphs[0]
        p1.runs[0].font.name = 'Times New Roman'
        p1.runs[0].font.size = Pt(10)
        set_cell_border(c1)
        set_cell_margins(c1, 50, 50, 100, 100)

    # MỤC LỤC
    doc.add_page_break()
    p_toc = doc.add_paragraph()
    p_toc.paragraph_format.space_before = Pt(14)
    p_toc.paragraph_format.space_after = Pt(8)
    r = p_toc.add_run('MỤC LỤC')
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)

    toc_items = [
        ("MỤC LỤC", "i", True, False, 0.0),
        ("DANH MỤC BẢNG", "iii", True, False, 0.0),
        ("CHƯƠNG 1 TỔNG QUAN VỀ ĐỀ TÀI NGHIÊN CỨU", "1", True, False, 0.0),
        ("1.1. Bối cảnh nghiên cứu và nhu cầu dùng thuốc ở phụ nữ cho con bú", "1", False, False, 0.25),
        ("1.2. Lý do chọn đề tài và vấn đề nghiên cứu", "1", False, False, 0.25),
        ("1.3. Mục tiêu nghiên cứu", "2", False, False, 0.25),
        ("1.4. Đối tượng nghiên cứu", "3", False, False, 0.25),
        ("1.5. Phạm vi nghiên cứu", "3", False, False, 0.25),
        ("1.6. Phương pháp nghiên cứu", "4", False, False, 0.25),
        ("1.7. Ý nghĩa khoa học và thực tiễn", "5", False, False, 0.25),
        ("1.8. Cấu trúc báo cáo", "6", False, False, 0.25),
        ("CHƯƠNG 2 CƠ SỞ LÝ THUYẾT VỀ SỬ DỤNG THUỐC KHI CHO CON BÚ VÀ TRÍ TUỆ NHÂN TẠO", "7", True, False, 0.0),
        ("2.1. Dược động học của thuốc qua sữa mẹ và các chỉ số an toàn", "7", False, False, 0.25),
        ("2.2. Phân loại mức độ an toàn thuốc ở phụ nữ cho con bú theo chuẩn quốc tế", "8", False, False, 0.25),
        ("2.3. Thực trạng khó khăn và rào cản trong tư vấn thuốc cho phụ nữ cho con bú", "9", False, False, 0.25),
        ("2.4. Trí tuệ nhân tạo tạo sinh và mô hình ngôn ngữ lớn trong y tế", "10", False, False, 0.25),
        ("2.5. Chatbot AI và kỹ thuật tăng cường truy xuất thông tin (RAG)", "10", False, False, 0.25),
        ("2.6. Nguyên tắc thiết kế rào chắn an toàn (Safety Guardrails) trong tư vấn dược khoa", "11", False, False, 0.25),
        ("2.7. Ứng dụng của AI trong thực hành Dược lâm sàng và thông tin thuốc", "12", False, False, 0.25),
        ("2.8. Vai trò của Chatbot AI trong tư vấn sử dụng thuốc cho phụ nữ cho con bú", "12", False, False, 0.25),
        ("CHƯƠNG 3 KHẢO SÁT NHU CẦU VÀ XÂY DỰNG BỘ KỊCH BẢN TƯ VẤN THUỐC CHO PHỤ NỮ CHO CON BÚ", "13", True, False, 0.0),
        ("3.1. Phương pháp khảo sát và xây dựng 15 tình huống tư vấn thực tế", "13", False, False, 0.25),
        ("3.2. Dữ liệu 15 tình huống sử dụng thuốc ở phụ nữ cho con bú", "14", False, False, 0.25),
        ("3.3. Đánh giá phân loại mức độ an toàn lâm sàng theo LactMed và APILAM", "16", False, False, 0.25),
        ("3.4. Phân tích dược động học bài tiết (Chỉ số RID, L/P ratio và thời gian bán thải)", "19", False, False, 0.25),
        ("3.5. Chiến lược tra cứu y văn LactMed, PubMed MeSH và Dược thư Quốc gia", "21", False, False, 0.25),
        ("3.6. So sánh tổng hợp các phương pháp tư vấn thông tin thuốc cho mẹ bỉm sữa", "21", False, False, 0.25),
        ("3.7. Đánh giá nhu cầu người dùng và khoảng trống thông tin trong thực tế", "22", False, False, 0.25),
        ("3.8. Kết luận chương và các yêu cầu dữ liệu cho hệ thống chatbot tư vấn", "23", False, False, 0.25),
        ("CHƯƠNG 4 THIẾT KẾ VÀ ĐÁNH GIÁ CHATBOT AI TƯ VẤN SỬ DỤNG THUỐC CHO PHỤ NỮ CHO CON BÚ", "24", True, False, 0.0),
        ("4.1. Mục tiêu thiết kế và các nguyên tắc an toàn y tế cốt tử", "24", False, False, 0.25),
        ("4.2. Phân tích chức năng hệ thống LactaMed AI và kiến trúc đề xuất", "25", False, False, 0.25),
        ("4.3. Thiết kế câu lệnh hệ thống tham chiếu (System Prompt LactaMed AI)", "26", False, False, 0.25),
        ("4.4. Quy trình tư vấn 5 bước và phân luồng thông điệp lâm sàng", "28", False, False, 0.25),
        ("4.5. Thiết kế bộ kiểm thử chatbot theo 15 tình huống", "29", False, False, 0.25),
        ("4.6. Khảo sát thực nghiệm và kết quả có thể xác nhận", "30", False, False, 0.25),
        ("4.7. Chỉ số đánh giá chất lượng và ngưỡng nghiệm thu đề xuất", "31", False, False, 0.25),
        ("4.8. Thảo luận về tính khả thi, độ tin cậy và giới hạn sử dụng", "33", False, False, 0.25),
        ("CHƯƠNG 5 ĐẠO ĐỨC SỐ VÀ AN TOÀN SỐ TRONG CHATBOT TƯ VẤN Y TẾ", "34", True, False, 0.0),
        ("5.1. Bảo vệ dữ liệu cá nhân và quyền riêng tư y tế của mẹ và bé", "34", False, False, 0.25),
        ("5.2. Kiểm soát rủi ro ảo giác AI (Hallucination) và an toàn tính mạng trẻ sơ sinh", "35", False, False, 0.25),
        ("5.3. Rủi ro đạo đức khi tư vấn thuốc cho đối tượng dễ tổn thương", "36", False, False, 0.25),
        ("5.4. Trách nhiệm pháp lý, ranh giới phần mềm y tế (SaMD) và tuyên bố miễn trừ y khoa", "37", False, False, 0.25),
        ("5.5. Năng lực số của người dùng và vai trò giám sát chuyên môn của Dược sĩ", "37", False, False, 0.25),
        ("5.6. Đề xuất quy tắc ứng xử số và an toàn vận hành", "38", False, False, 0.25),
        ("CHƯƠNG 6 KẾT LUẬN VÀ KIẾN NGHỊ", "39", True, False, 0.0),
        ("6.1. Kết luận chung của đề tài", "39", False, False, 0.25),
        ("6.2. Đóng góp của báo cáo nghiên cứu", "40", False, False, 0.25),
        ("6.3. Hạn chế nghiên cứu", "41", False, False, 0.25),
        ("6.4. Kiến nghị và định hướng phát triển", "42", False, False, 0.25),
        ("TÀI LIỆU THAM KHẢO", "44", True, False, 0.0),
        ("NHẬN XÉT CÁ NHÂN SAU KHI THỰC HIỆN ĐỀ TÀI", "46", True, False, 0.0),
        ("PHỤ LỤC A  BỘ CÂU HỎI KIỂM THỬ GỢI Ý CHO PHỤ NỮ CHO CON BÚ", "47", True, False, 0.0),
        ("PHỤ LỤC B  PHIẾU CHẤM PHẢN HỒI CHATBOT TƯ VẤN DƯỢC KHOA", "50", True, False, 0.0)
    ]
    for text, pg, is_b, is_i, ind in toc_items:
        add_toc_line(doc, text, pg, is_b, is_i, ind)

    # DANH MỤC BẢNG
    doc.add_page_break()
    p_lot = doc.add_paragraph()
    p_lot.paragraph_format.space_before = Pt(14)
    p_lot.paragraph_format.space_after = Pt(8)
    r = p_lot.add_run('DANH MỤC BẢNG')
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)

    lot_items = [
        ("Bảng 1.1. Liên hệ sáu miền năng lực số theo Thông tư 02/2025/TT-BGDĐT với nội dung thực hiện", "6"),
        ("Bảng 2.1. Phân loại các nhóm thuốc phổ biến ở phụ nữ cho con bú và lưu ý lâm sàng", "8"),
        ("Bảng 3.1. Mười lăm tình huống sử dụng thuốc phổ biến ở phụ nữ cho con bú", "15"),
        ("Bảng 3.2. Đánh giá mức độ an toàn theo phân loại LactMed và e-lactancia", "17"),
        ("Bảng 3.3. Dữ liệu dược động học bài tiết qua sữa mẹ (L/P ratio, RID, T1/2) của 15 hoạt chất", "19"),
        ("Bảng 3.4. Chiến lược tra cứu y văn LactMed và PubMed MeSH cho các hoạt chất phổ biến", "21"),
        ("Bảng 3.5. So sánh tổng hợp các phương pháp tư vấn thông tin thuốc cho phụ nữ cho con bú", "22"),
        ("Bảng 4.1. Kiến trúc chức năng đề xuất của LactaMed AI và ranh giới an toàn y tế", "26"),
        ("Bảng 4.2. Kết quả kiểm thử thực nghiệm trên 15 tình huống đối chiếu tiêu chuẩn vàng", "31"),
        ("Bảng 4.3. Bộ chỉ số chất lượng và nguyên tắc nghiệm thu đề xuất cho chatbot y tế", "32"),
        ("Bảng 5.1. Bảng kiểm tra an toàn và đạo đức số cho ứng dụng tư vấn thuốc cho con bú", "38")
    ]
    for text, pg in lot_items:
        add_toc_line(doc, text, pg, is_bold=False, indent_in=0.0)

    # ============================================================
    # SECTION 2: CHƯƠNG 1 ĐẾN HẾT (MAIN BODY & BACK MATTER)
    # Numbering: Arabic (1, 2, 3...) right-aligned footer starting at 1
    # ============================================================
    sec2 = doc.add_section(docx.enum.section.WD_SECTION.NEW_PAGE)
    sec2.page_width = Inches(8.5)
    sec2.page_height = Inches(11.0)
    sec2.top_margin = Inches(1.0)
    sec2.bottom_margin = Inches(1.0)
    sec2.left_margin = Inches(1.0)
    sec2.right_margin = Inches(1.0)
    add_footer_field(sec2, num_fmt=None, start_num=1)

    # Append chapters 01 to 08
    body_chapter_files = [
        'Docs/Report/final/chapters/01_Chuong_1_Tong_Quan.md',
        'Docs/Report/final/chapters/02_Chuong_2_Co_So_Ly_Thuyet.md',
        'Docs/Report/final/chapters/03_Chuong_3_Thu_Thap_Danh_Gia_Kiem_Chung.md',
        'Docs/Report/final/chapters/04_Chuong_4_Thiet_Ke_Danh_Gia_Chatbot_AI.md',
        'Docs/Report/final/chapters/05_Chuong_5_Dao_Duc_So_Va_An_Toan_So.md',
        'Docs/Report/final/chapters/06_Chuong_6_Ket_Luan_Va_Kien_Nghi.md',
        'Docs/Report/final/chapters/07_Tai_Lieu_Tham_Khao_APA7.md',
        'Docs/Report/final/chapters/08_Nhan_Xet_Ca_Nhan_Va_Phu_Luc.md'
    ]

    for idx, fpath in enumerate(body_chapter_files):
        with open(fpath, 'r', encoding='utf-8') as fp:
            text = fp.read()
        append_section_markdown(doc, text)
        if idx < len(body_chapter_files) - 1:
            doc.add_page_break()

    # Save final docx
    doc.save(output_docx)
    print(f"Successfully generated: {output_docx}")

if __name__ == '__main__':
    generate_master_final_report()
