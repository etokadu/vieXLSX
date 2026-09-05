# vieXLSX — CLI Todo Manager Synchronized with Excel (v2.0.0)

> CLI and interactive todo manager that natively stores and formats tasks in an Excel workbook.

![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue.svg) ![Excel Supported](https://img.shields.io/badge/Excel-Supported-success.svg) ![License MIT](https://img.shields.io/badge/License-MIT-green.svg)

---

## 1. Introduction

### About the Author
Hello! I am **Kudo (Pham Thai Dang Minh)**, an Information Technology (IT) student at the University of Information Technology, Vietnam National University Ho Chi Minh City (UIT - VNU-HCM).

### About the Project
**vieXLSX** is a command-line interface (CLI) and interactive task management system designed to keep your workflow organized while securely storing all data in a standard Excel workbook (`task.xlsx`).

Unlike traditional CLI tools that use hidden JSON or SQLite databases, vieXLSX leverages `openpyxl` to generate a fully formatted, human-readable Excel file complete with color-coded priorities, data validation dropdowns, and clickable checkboxes.

---

## 🚀 What's New in v2.0.0?
- **Enhanced Interactive UI**: Improved Text User Interface (TUI) for smoother navigation and faster task entry.
- **Advanced Data Validation**: Stricter Excel cell data validation for custom categories and tags.
- **Cross-Platform Compatibility**: Better path handling and support for Linux/macOS.
- **Performance Optimization**: Faster read/write times for large `task.xlsx` files.

---

## 2. Features & How It Works

vieXLSX operates through a two-stage pipeline: a CLI/Interactive Client and an Excel Generator backend.

```text
      user input (CLI args / Interactive Menu)
                        |
       +------------------------------------+
       | 1. TaskManager (src/main.py)       |
       |  - parses arguments & user cmds    |
       |  - manages task data in memory     |
       +------------------------------------+
                        |
       +------------------------------------+
       | 2. ExcelGenerator (src/generator.py) |
       |  - handles openpyxl operations     |
       |  - applies styles & validation     |
       +------------------------------------+
               /                    \
  [ vieTasks.xlsx ]         [ src/config.json ]
```

### Core Features:
- **Dual Mode Operation**: Run standalone CLI commands or launch the interactive terminal UI.
- **Native Excel Integration**: Tasks are saved to `task.xlsx` with beautiful styling, conditional formatting (e.g., overdue tasks turn red, completed tasks are struck through), and data validation.
- **Advanced Filtering & Sorting**: Sort tasks by priority, status, or due date, and export filtered views directly to a new Excel sheet.
- **Customizable Settings**: Freely configure custom categories (e.g., work, personal) and tags via the `config.json` file.
- **Standalone Windows Executable**: Build script included to compile the Python source into a portable `.exe` file.

---

## 3. Installation & Setup

### Prerequisites
- **Python 3.8 or higher**
- `pip` package manager

### Step 1: Clone the Repository
```bash
git clone https://github.com/vinhkudo/vieXLSX.git
cd vieXLSX
```

### Step 2: Create a Virtual Environment (Optional but recommended)
**Windows**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**Linux / macOS**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Build the Windows EXE (Optional)
Run this script from the repository root to build a single-file executable:
```bash
compile.bat
```
*The script places `vieXLSX.exe` in the `dist` folder. Keep `config.json` and `task.xlsx` next to the EXE to save changes.*

---

## 4. Project Structure

```text
vieXLSX/
├── src/                  # Application source code
│   ├── main.py           # Entry point & interactive CLI logic
│   ├── tasks.py          # Task management & sync logic
│   ├── generator.py      # Excel file creation & formatting
│   ├── config.json       # User settings, categories, and tags
│   └── test.xlsx         # Generated Excel workbook
├── req/                  # Build scripts & execution environments
│   ├── compile.bat       # PyInstaller build script for Windows
│   ├── requirements.txt  # Python dependencies (openpyxl, etc.)
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```

---

## 5. Usage

### 1. Interactive Workspace Mode
To launch the interactive TUI (Text User Interface) with menus, task sheets, and settings:
```bash
python src/main.py
```

### 2. Standalone CLI Commands
To manage tasks directly from the command line without opening the UI:

**List all tasks:**
```bash
python src/main.py list
```

**Add a new task:**
```bash
python src/main.py add --title "Prepare report" --priority "High" --category "Work"
```

**Search for a task:**
```bash
python src/main.py search "report"
```

*(If using the built EXE, replace `python src/main.py` with `dist\vieXLSX.exe`)*

---

## 6. Configuration Schema: `config.json`

Categories, tags, and app metadata are managed in `config.json`:

```json
{
  "app_name": "vieXLSX",
  "version": "2.0.0",
  "author": "Kudo",
  "github": "https://github.com/vinhkudo/vieXLSX",
  "category_options": [
    "Work",
    "Personal",
    "None"
  ],
  "tag_options": [
    "Important",
    "Urgent",
    "Meeting"
  ]
}
```

---

## 7. Author

- **Author**: Kudo
- **Institution**: University of Information Technology (UIT - VNU-HCM)
- **Major**: Information Technology
- **GitHub**: [@vinhkudo](https://github.com/vinhkudo)
- **Repository**: [https://github.com/vinhkudo/vieXLSX](https://github.com/vinhkudo/vieXLSX)

---

## 8. License & Citation

**License**: This project is open-source software licensed under the **MIT License**.
