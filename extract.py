import fitz  # PyMuPDF
import sys

def extract_text(pdf_path, txt_path):
    print(f"Opening {pdf_path}...")
    try:
        doc = fitz.open(pdf_path)
        with open(txt_path, 'w', encoding='utf-8') as f:
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                f.write(f"--- Page {page_num + 1} ---\n")
                f.write(text)
                f.write("\n")
        print(f"Successfully extracted {len(doc)} pages to {txt_path}.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    pdf_file = "Professional Cloud Security Engineer Exam _ ExamTopics.pdf"
    txt_file = "extracted_exam_topics.txt"
    extract_text(pdf_file, txt_file)
