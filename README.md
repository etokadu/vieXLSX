# vieXLSX — CLI Todo Manager Synchronized with Excel (v1.0.0)

> **CLI and interactive todo manager that natively stores and formats tasks in an Excel workbook.**
>
> ![Python 3.x](https://img.shields.io/badge/Python-3.x-blue.svg) ![Excel](https://img.shields.io/badge/Excel-Supported-green.svg) ![License MIT](https://img.shields.io/badge/License-MIT-green.svg)

---

## 1. Introduction

### About the Author
Hello! I am **Kadu** (Pham Thai Dang Minh), an Information Technology (IT) student at the University of Information Technology, Vietnam National University Ho Chi Minh City (UIT - VNU-HCM).

### About the Project
vieXLSX is a command-line interface (CLI) and interactive task management system designed to keep your workflow organized while securely storing all data in a standard Excel workbook (`todo.xlsx`). 

Unlike traditional CLI tools that use hidden JSON or SQLite databases, vieXLSX leverages `openpyxl` to generate a fully formatted, human-readable Excel file complete with color-coded priorities, data validation dropdowns, and clickable checkboxes.

---

## 2. Features & How It Works

vieXLSX operates through a two-stage pipeline: a CLI/Interactive Client and an Excel Generator backend.

```text
       User Input (CLI args / Interactive Menu)
                          |
                          v
  +-------------------------------------------------+
  | 1. TodoClient (src/client.py)                   |
  |    - Parses arguments & user commands           |
  |    - Manages task state in memory               |
  +-------------------------------------------------+
                          |
                          v
  +-------------------------------------------------+
  | 2. ExcelGenerator (src/generator.py)            |
  |    - Handles openpyxl workbook operations       |
  |    - Applies styles, auto-filters & validation  |
  +-------------------------------------------------+
               /                     \
              v                       v
    [ src/todo.xlsx ]           [ src/config.json ]
```

### Core Features:
*   **Dual Mode Operation:** Run standalone CLI commands or launch the interactive terminal UI.
*   **Native Excel Integration:** Tasks are saved to `todo.xlsx` with beautiful styling, conditional formatting (e.g., overdue tasks turn red, completed tasks are struck through), and data validation.
*   **Advanced Filtering & Sorting:** Sort tasks by priority, status, or due date, and export filtered views directly to a new Excel sheet.
*   **Customizable Settings:** Easily configure custom categories (e.g., *work, personal*) and tags via the `config.json` file.
*   **Standalone Windows Executable:** Build script included to compile the Python source into a portable `.exe` file.

---

## 3. Installation & Setup

### Prerequisites
*   **Python 3.8 or higher**
*   `pip` package manager

### Step 1: Clone the Repository
```powershell
git clone https://github.com/etokadu/vieXLSX.git
cd vieXLSX
```

### Step 2: Create a Virtual Environment (Optional but recommended)
**Windows**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**Linux / macOS**
```bash
python -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Build the Windows EXE (Optional)
Run this script from the repository root to build a single-file executable:
```powershell
run\build.bat
```
*The script places `vieXLSX.exe` in the `run/` folder. Keep `config.json` and `todo.xlsx` next to the EXE to save changes.*

---

## 4. Project Structure

```text
vieXLSX/
├── src/                    # Application source code
│   ├── main.py             # Entry point & interactive CLI logic
│   ├── client.py           # Task management & sync logic
│   ├── generator.py        # Excel file creation & formatting 
│   ├── config.json         # User settings, categories, and tags
│   └── todo.xlsx           # Generated Excel workbook
├── run/                    # Build scripts & execution environment
│   ├── build.bat           # PyInstaller build script for Windows
│   └── vieXLSX.exe         # Generated executable (after build)
├── .gitignore              # Git ignore rules
├── requirements.txt        # Python dependencies
└── README.md               # Documentation
```

---

## 5. Usage

### 1. Interactive Workspace Mode
To launch the interactive TUI (Text User Interface) with menus, task sheets, and settings:
```powershell
python src\main.py
```

### 2. Standalone CLI Commands
To manage tasks directly from the command line without opening the UI:

**List all tasks:**
```powershell
python src\main.py list
```

**Add a new task:**
```powershell
python src\main.py add --title "Prepare report" --priority "high" --category "work"
```

**Search for a task:**
```powershell
python src\main.py search "report"
```

*(If using the built EXE, replace `python src\main.py` with `run\vieXLSX.exe`)*

---

## 6. Configuration Schema: \`config.json\`

Categories, tags, and app metadata are managed in `config.json`.

```json
{
  "app_name": "vieXLSX",
  "version": "1.0.0",
  "author": "Kadu",
  "github": "https://github.com/etokadu/vieXLSX",
  "category_options": [
    "work",
    "personal",
    "home"
  ],
  "tag_options": [
    "important",
    "urgent",
    "meeting"
  ]
}
```

---

## 7. Author

*   **Author:** Kadu
*   **Institution:** University of Information Technology (UIT - VNU-HCM)
*   **Major:** Information Technology
*   **GitHub:** [@etokadu](https://github.com/etokadu)
*   **Repository:** [https://github.com/etokadu/vieXLSX](https://github.com/etokadu/vieXLSX)

---

## 8. License & Citation

**License**
This project is open-source software licensed under the **MIT License**.
