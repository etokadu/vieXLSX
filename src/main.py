import argparse
import json
import os
import sys
import threading
import time

from client import TodoClient
from generator import Task


def appDirectory():
    if getattr(sys, "frozen", False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def resourceDirectory():
    if getattr(sys, "_MEIPASS", None):
        return sys._MEIPASS
    return os.path.dirname(appDirectory())


CONFIG_PATH = os.path.join(appDirectory(), "config.json")


def loadConfig():
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError):
        return {}


def saveConfig(config):
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as file:
            json.dump(config, file, indent=2, ensure_ascii=False)
        return True
    except OSError:
        return False


def configOptions(key):
    return list(CONFIG.get(key, []))


CONFIG = loadConfig()
SORT_FIELDS = list(Task.__dataclass_fields__.keys())
APP_NAME = CONFIG.get("app_name", "vieXLSX")
APP_VERSION = CONFIG.get("version", "1.0.0")
APP_AUTHOR = CONFIG.get("author", "Kadu")
APP_GITHUB = CONFIG.get(
    "github",
    "https://github.com/etokadu/vieXLSX"
)
DEFAULT_EXCEL_PATH = os.path.join(
    appDirectory(),
    "todo.xlsx"
)


def printTasks(tasks):
    if not tasks:
        print("No tasks found.")
        return

    for task in tasks:
        print(
            f"[{task.id}] {task.title} | "
            f"status={task.status} | "
            f"priority={task.priority} | "
            f"due={task.due_date} | "
            f"category={task.category} | "
            f"tags={task.tags}"
        )
        if task.description:
            print(f"    {task.description}")


def clearScreen():
    print("\033[2J\033[H", end="")


def printTitle():
    print("\033[1;36m")
    print("██╗░░░██╗██╗███████╗██╗░░██╗██╗░░░░░░██████╗██╗░░██╗")
    print("██║░░░██║██║██╔════╝╚██╗██╔╝██║░░░░░██╔════╝╚██╗██╔╝")
    print("╚██╗░██╔╝██║█████╗░░░╚███╔╝░██║░░░░░╚█████╗░░╚███╔╝░")
    print("░╚████╔╝░██║██╔══╝░░░██╔██╗░██║░░░░░░╚═══██╗░██╔██╗░")
    print("░░╚██╔╝░░██║███████╗██╔╝╚██╗███████╗██████╔╝██╔╝╚██╗")
    print("░░░╚═╝░░░╚═╝╚══════╝╚═╝░░╚═╝╚══════╝╚═════╝░╚═╝░░╚═╝")
    print(f"  {APP_NAME}  v{APP_VERSION}  by {APP_AUTHOR}")
    print(f"  {APP_GITHUB}")
    print("\033[0m")


def runLoading(label, action):
    result = [None]

    def worker():
        try:
            result[0] = action()
        except Exception:
            result[0] = None

    thread = threading.Thread(target=worker)
    thread.start()
    frames = ["|", "/", "-", "\\"]
    progress = 8
    frameIndex = 0

    while thread.is_alive():
        bar = "#" * (progress // 5)
        bar = bar.ljust(20, ".")
        print(
            f"\r{frames[frameIndex % len(frames)]} "
            f"{label} [{bar}] {progress}%",
            end="",
            flush=True
        )
        frameIndex += 1
        progress = min(progress + 4, 92)
        time.sleep(0.08)

    thread.join()
    print(
        f"\r* {label} [{('#' * 20)}] 100%"
        + " " * 10
    )
    return result[0]


def chooseMenu(title, options):
    try:
        import msvcrt
    except ImportError:
        return input(f"{title}: ").strip()

    selected = 0

    while True:
        clearScreen()
        printTitle()
        print(title)
        print("Use Up/Down and Enter. Esc cancels.\n")

        for index, option in enumerate(options):
            if index == selected:
                print(f"\033[7m > {option}\033[0m")
            else:
                print(f"   {option}")

        key = msvcrt.getwch()

        if key in ("\x00", "\xe0"):
            key = msvcrt.getwch()
            if key == "H":
                selected = (selected - 1) % len(options)
            elif key == "P":
                selected = (selected + 1) % len(options)
        elif key in ("\r", "\n"):
            return options[selected]
        elif key == "\x1b":
            return None


def pause():
    input("\nPress Enter to continue...")


def clearPendingKeys(msvcrt):
    while msvcrt.kbhit():
        msvcrt.getwch()


def textInput(prompt):
    if os.name != "nt":
        return input(prompt)

    try:
        import ctypes
        import msvcrt

        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if not hwnd:
            return input(prompt)

        imm32 = ctypes.windll.imm32
        inputContext = imm32.ImmGetContext(hwnd)
        oldImeOpen = None
        if inputContext:
            oldImeOpen = imm32.ImmGetOpenStatus(inputContext)
            imm32.ImmSetOpenStatus(inputContext, False)
        oldContext = imm32.ImmAssociateContext(hwnd, 0)
        try:
            clearPendingKeys(msvcrt)
            print(prompt, end="", flush=True)
            value = []

            while True:
                key = msvcrt.getwch()

                if key in ("\r", "\n"):
                    print()
                    return "".join(value)

                if key == "\x1b":
                    print("\nCancelled.")
                    return None

                if key in ("\x00", "\xe0"):
                    msvcrt.getwch()
                    continue

                if key in ("\b", "\x7f"):
                    if value:
                        value.pop()
                        print("\b \b", end="", flush=True)
                    continue

                value.append(key)
                print(key, end="", flush=True)
        finally:
            imm32.ImmAssociateContext(hwnd, oldContext)
            if inputContext:
                if oldImeOpen:
                    imm32.ImmSetOpenStatus(inputContext, True)
                imm32.ImmReleaseContext(hwnd, inputContext)
    except (AttributeError, OSError):
        return input(prompt)


def chooseDropdown(title, key, allowEmpty=True):
    options = configOptions(key)
    options = options + ["Add new", "Cancel"]
    selected = chooseMenu(title, options)

    if selected in (None, "Cancel"):
        return None
    if selected == "Add new":
        value = textInput("New value: ")
        if value is None:
            return None
        value = value.strip()
        if not value:
            return "" if allowEmpty else None
        if value not in CONFIG.setdefault(key, []):
            CONFIG[key].append(value)
            saveConfig(CONFIG)
        return value
    return selected


def editTimeValue(current=""):
    from datetime import datetime

    try:
        value = datetime.fromisoformat(current)
    except ValueError:
        value = datetime.now().replace(microsecond=0)

    parts = [value.hour, value.minute, value.second]
    selected = 0

    while True:
        clearScreen()
        printTitle()
        print("Time picker: Up/Down change, Left/Right move")
        print("Enter moves to next part, End confirms, Esc cancels.\n")
        rendered = []
        for index, part in enumerate(parts):
            text = f"{part:02d}"
            rendered.append(
                f"\033[7m{text}\033[0m"
                if index == selected
                else text
            )
        print(": ".join(rendered).replace(": ", ":"))

        key = readKey()
        if key == "escape":
            return None
        if key == "up":
            parts[selected] = (parts[selected] + 1) % (
                24 if selected == 0 else 60
            )
        elif key == "down":
            parts[selected] = (parts[selected] - 1) % (
                24 if selected == 0 else 60
            )
        elif key == "left":
            selected = (selected - 1) % 3
        elif key == "right" or key == "enter":
            selected = (selected + 1) % 3
        elif key == "end":
            return f"{parts[0]:02d}:{parts[1]:02d}:{parts[2]:02d}"


def readKey():
    import msvcrt

    key = msvcrt.getwch()

    if key in ("\x00", "\xe0"):
        key = msvcrt.getwch()
        return {
            "H": "up",
            "P": "down",
            "K": "left",
            "M": "right",
            "O": "end"
        }.get(key, "unknown")

    return {
        "\r": "enter",
        "\n": "enter",
        "\x1b": "escape",
        "\x01": "add",
        "d": "delete",
        "D": "delete",
        "r": "refresh",
        "R": "refresh"
    }.get(key, key)


def addTaskInteractive(client):
    clearScreen()
    printTitle()
    clearPendingKeys(__import__("msvcrt"))
    title = textInput("Title: ")
    if title is None:
        return

    description = textInput("Description: ")
    if description is None:
        return

    status = textInput("Status [todo]: ")
    if status is None:
        return

    priority = textInput("Priority [normal]: ")
    if priority is None:
        return

    dueDate = textInput("Due date: ")
    if dueDate is None:
        return

    category = chooseDropdown(
        "Category",
        "category_options"
    )
    if category is None:
        return

    tags = chooseDropdown(
        "Tags",
        "tag_options"
    )
    if tags is None:
        return

    task = client.addTask(
        title=title,
        description=description,
        status=status or "todo",
        priority=priority or "normal",
        due_date=dueDate,
        category=category,
        tags=tags
    )
    print(f"Added task {task.id} to client. Press S in Task sheet to save Excel.") if task else print("Add task failed.")
    pause()


def editCell(client, task, field):
    clearScreen()
    printTitle()
    print(f"Edit {field} for task {task.id}")
    current = getattr(task, field)
    if field in ("created_time", "completed_time", "due_date"):
        value = editTimeValue(str(current))
    elif field == "category":
        value = chooseDropdown("Category", "category_options")
    elif field == "tags":
        value = chooseDropdown("Tags", "tag_options")
    else:
        value = textInput(f"New value [{current}]: ")

    if value is not None and value != "":
        setattr(task, field, value)
        client.markChanged()
        print(
            "Saved."
            if client.save()
            else "Save failed."
        )
    elif value is None:
        print("Edit cancelled.")
    pause()


def taskSheet(client):
    fields = [
        "id",
        "done",
        "title",
        "description",
        "status",
        "priority",
        "due_date",
        "category",
        "tags",
        "created_time",
        "completed_time"
    ]
    headers = [
        "ID", "DONE", "TITLE", "DESCRIPTION", "STATUS", "PRIORITY",
        "DUE DATE", "CATEGORY", "TAGS", "CREATED", "COMPLETED"
    ]
    rowIndex = 0
    columnIndex = 0

    while True:
        tasks = runLoading("Refreshing task sheet", client.listTasks)
        if tasks is None:
            print("Could not read Excel.")
            pause()
            return

        rowIndex = min(rowIndex, max(0, len(tasks) - 1))
        columnIndex = min(columnIndex, len(fields) - 1)
        clearScreen()
        printTitle()
        dirtyText = " * UNSAVED" if client.dirty else ""
        print("TASK SHEET" + dirtyText + "  |  Arrows: move  Enter: edit  Ctrl+A: add  D: delete")
        print("S: save Excel  R: refresh  Esc: back\n")
        print(" | ".join(
            f"[{header}]" if index == columnIndex else header
            for index, header in enumerate(headers)
        ))
        print("-" * 130)

        if not tasks:
            print("No tasks. Press A to add one or Esc to go back.")
        else:
            for index, task in enumerate(tasks):
                values = []
                for fieldIndex, field in enumerate(fields):
                    value = (
                        "☑"
                        if task.done
                        else "☐"
                    ) if field == "done" else str(
                        getattr(task, field)
                    )
                    value = value.replace("\n", " ")[:18]
                    if index == rowIndex and fieldIndex == columnIndex:
                        value = f"\033[7m{value[:16]:<16}\033[0m"
                    else:
                        value = f"{value[:16]:<16}"
                    values.append(value)
                print(" | ".join(values))

        key = readKey()

        if key == "escape":
            return
        if key == "up" and tasks:
            rowIndex = (rowIndex - 1) % len(tasks)
        elif key == "down" and tasks:
            rowIndex = (rowIndex + 1) % len(tasks)
        elif key == "left":
            columnIndex = (columnIndex - 1) % len(fields)
        elif key == "right":
            columnIndex = (columnIndex + 1) % len(fields)
        elif key == "refresh":
            continue
        elif key == "s" or key == "S":
            clearScreen()
            printTitle()
            print(
                "Excel updated."
                if runLoading("Saving Excel", client.save)
                else "Excel save failed. Tasks remain in client."
            )
            pause()
        elif key == "add":
            addTaskInteractive(client)
        elif key == "delete" and tasks:
            client.delete(tasks[rowIndex].id)
        elif key == "enter" and tasks:
            field = fields[columnIndex]
            if field == "done":
                tasks[rowIndex].done = not tasks[rowIndex].done
                if tasks[rowIndex].done:
                    tasks[rowIndex].status = "done"
                elif tasks[rowIndex].status == "done":
                    tasks[rowIndex].status = "todo"
                client.markChanged()
                client.save()
            elif field == "id":
                action = chooseMenu(
                    "Selected task",
                    ["Edit task", "Complete task", "Delete task", "Cancel"]
                )
                if action == "Edit task":
                    editCell(client, tasks[rowIndex], "title")
                elif action == "Complete task":
                    client.complete(tasks[rowIndex].id)
                elif action == "Delete task":
                    client.delete(tasks[rowIndex].id)
            else:
                editCell(client, tasks[rowIndex], field)


def runInteractive(client):
    options = [
        "Introduction",
        "Task sheet",
        "Settings",
        "Exit"
    ]

    while True:
        choice = chooseMenu("Todo workspace", options)

        if choice in (None, "Exit"):
            return 0

        if choice == "Introduction":
            clearScreen()
            printTitle()
            print(f"Version {APP_VERSION} | Created by {APP_AUTHOR}")
            print(APP_GITHUB)
            pause()
        elif choice == "Settings":
            clearScreen()
            printTitle()
            print(f"Excel file: {client.generator.path}")
            print("Main sheet: Tasks")
            print("Filter sheet: site filter")
            print(f"GitHub: {APP_GITHUB}")
            print(f"Version: {APP_VERSION}")
            print(f"Author: {APP_AUTHOR}")
            print(f"Last update: {CONFIG.get('last_update', '')}")
            print(
                "Latest feature: "
                f"{CONFIG.get('latest_feature', '')}"
            )
            print("\nUse the menu below to edit dropdown values.")
            manageConfig()
            pause()
        elif choice == "Task sheet":
            taskSheet(client)


def manageConfig():
    choice = chooseMenu(
        "Config settings",
        [
            "Add category",
            "Edit category",
            "Delete category",
            "Add tag",
            "Edit tag",
            "Delete tag",
            "Back"
        ]
    )

    mapping = {
        "category": "category_options",
        "tag": "tag_options"
    }

    if choice in (None, "Back"):
        return

    action, valueType = choice.split(" ", 1)
    key = mapping[valueType.lower()]
    values = CONFIG.setdefault(key, [])

    if action == "Add":
        value = textInput(f"New {valueType}: ")
        if value is None:
            return
        value = value.strip()
        if value and value not in values:
            values.append(value)
    else:
        selected = chooseMenu(
            f"Select {valueType}",
            values + ["Cancel"]
        )
        if selected in (None, "Cancel"):
            return
        if action == "Edit":
            replacement = textInput(
                f"New value for {selected}: "
            )
            if replacement is None:
                return
            replacement = replacement.strip()
            if replacement:
                values[values.index(selected)] = replacement
        elif action == "Delete":
            values.remove(selected)

    saveConfig(CONFIG)


def runLegacyInteractive(client):
    options = [
        "List tasks",
        "Add task",
        "Search tasks",
        "Sort tasks",
        "Filter tasks",
        "Complete task",
        "Delete task",
        "Exit"
    ]

    while True:
        choice = chooseMenu("Todo actions", options)

        if choice in (None, "Exit"):
            return 0

        if choice == "List tasks":
            clearScreen()
            printTitle()
            printTasks(runLoading("Loading tasks", client.listTasks))
            pause()
        elif choice == "Add task":
            clearScreen()
            printTitle()
            task = client.addTask(
                title=input("Title: "),
                description=input("Description: "),
                status=input("Status [todo]: ") or "todo",
                priority=input("Priority [normal]: ") or "normal",
                due_date=input("Due date: "),
                category=input("Category: "),
                tags=input("Tags: ")
            )
            print(
                f"Added task {task.id}."
                if task
                else "Add task failed."
            )
            pause()
        elif choice == "Search tasks":
            clearScreen()
            printTitle()
            query = input("Search: ")
            printTasks(runLoading(
                "Searching tasks",
                lambda: client.search(query)
            ))
            pause()
        elif choice == "Sort tasks":
            field = chooseMenu(
                "Sort field",
                ["title", "status", "priority", "due_date", "Cancel"]
            )
            if field in (None, "Cancel"):
                continue
            reverse = input("Descending? [y/N]: ").lower() == "y"
            print(
                "Sorted and saved to Excel."
                if runLoading(
                    "Sorting tasks",
                    lambda: client.sort(field, reverse)
                )
                else "Sort failed."
            )
            pause()
        elif choice == "Filter tasks":
            clearScreen()
            printTitle()
            criteria = {
                "status": input("Status: "),
                "priority": input("Priority: "),
                "category": input("Category: "),
                "tags": input("Tags: "),
                "due_date": input("Due date: ")
            }
            tasks = runLoading(
                "Filtering tasks",
                lambda: client.filter(criteria)
            )
            printTasks(tasks)
            print(
                "Saved to sheet 'site filter'."
                if tasks is not None
                else "Filter failed."
            )
            pause()
        elif choice == "Complete task":
            clearScreen()
            printTitle()
            taskId = input("Task ID: ")
            print(
                "Task completed."
                if runLoading(
                    "Updating task",
                    lambda: client.complete(taskId)
                )
                else "Complete task failed."
            )
            pause()
        elif choice == "Delete task":
            clearScreen()
            printTitle()
            taskId = input("Task ID: ")
            print(
                "Task deleted."
                if runLoading(
                    "Deleting task",
                    lambda: client.delete(taskId)
                )
                else "Delete task failed."
            )
            pause()


def buildParser():
    parser = argparse.ArgumentParser(
        description="CLI todo list synchronized with Excel"
    )
    parser.add_argument(
        "--web",
        action="store_true",
        help="run the local browser server instead of the desktop window"
    )
    parser.add_argument(
        "--cli",
        action="store_true",
        help="open the legacy interactive terminal UI"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8765,
        help="web server port"
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="do not open a browser when starting the web app"
    )
    parser.add_argument(
        "--file",
        default=DEFAULT_EXCEL_PATH,
        help="Excel file path"
    )
    commands = parser.add_subparsers(
        dest="command"
    )

    add = commands.add_parser("add")
    add.add_argument("--title", required=True)
    add.add_argument("--description", default="")
    add.add_argument("--status", default="todo")
    add.add_argument("--priority", default="normal")
    add.add_argument("--due-date", default="")
    add.add_argument("--category", default="")
    add.add_argument("--tags", default="")

    commands.add_parser("list")

    search = commands.add_parser("search")
    search.add_argument("query")

    sort = commands.add_parser("sort")
    sort.add_argument("--by", choices=SORT_FIELDS, required=True)
    sort.add_argument("--desc", action="store_true")

    filter_command = commands.add_parser("filter")
    filter_command.add_argument("--status", default="")
    filter_command.add_argument("--priority", default="")
    filter_command.add_argument("--category", default="")
    filter_command.add_argument("--tags", default="")
    filter_command.add_argument("--due-date", default="")

    complete = commands.add_parser("complete")
    complete.add_argument("id", type=int)

    delete = commands.add_parser("delete")
    delete.add_argument("id", type=int)

    commands.add_parser("sync")
    return parser


def main():
    parser = buildParser()
    args = parser.parse_args()

    if args.command is None and not args.cli and not args.web:
        from desktop_app import run_desktop_app

        frontendPath = os.path.join(resourceDirectory(), "frontend")
        return run_desktop_app(args.file, frontendPath, CONFIG, args.port)

    if args.command is None and args.web:
        from web_server import run_web_server

        frontendPath = os.path.join(resourceDirectory(), "frontend")
        return run_web_server(
            args.file,
            frontendPath,
            CONFIG,
            port=args.port,
            open_browser=not args.no_browser
        )

    if args.command is None:
        return runInteractive(TodoClient(args.file))

    client = TodoClient(args.file)

    if args.command == "add":
        task = client.addTask(
            title=args.title,
            description=args.description,
            status=args.status,
            priority=args.priority,
            due_date=args.due_date,
            category=args.category,
            tags=args.tags
        )
        if task is None:
            print("Add task failed.")
            return 1
        if not client.save():
            print(
                f"Added task {task.id} to client, "
                "but Excel save failed."
            )
            return 1
        print(f"Added task {task.id} and saved to Excel.")
        return 0

    if args.command == "list":
        tasks = client.listTasks()
        if tasks is None:
            print("Read Excel failed.")
            return 1
        printTasks(tasks)
        return 0

    if args.command == "search":
        tasks = client.search(args.query)
        if tasks is None:
            print("Search failed.")
            return 1
        printTasks(tasks)
        return 0

    if args.command == "sort":
        if not client.sort(args.by, args.desc):
            print("Sort failed.")
            return 1
        print("Sorted and saved to Excel.")
        return 0

    if args.command == "filter":
        criteria = {
            "status": args.status,
            "priority": args.priority,
            "category": args.category,
            "tags": args.tags,
            "due_date": args.due_date
        }
        tasks = client.filter(criteria)
        if tasks is None:
            print("Filter failed.")
            return 1
        printTasks(tasks)
        print("Saved filtered tasks to sheet 'site filter'.")
        return 0

    if args.command == "complete":
        if not client.complete(args.id):
            print("Complete task failed.")
            return 1
        print("Task completed and saved to Excel.")
        return 0

    if args.command == "delete":
        if not client.delete(args.id):
            print("Delete task failed.")
            return 1
        print("Task deleted and saved to Excel.")
        return 0

    if args.command == "sync":
        tasks = client.listTasks()
        if tasks is None:
            print("Sync failed.")
            return 1
        print(f"Loaded {len(tasks)} task(s) from Excel.")
        return 0

    return 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        try:
            with open(os.path.join(appDirectory(), "app-error.log"), "a", encoding="utf-8") as file:
                file.write(f"{type(error).__name__}: {error}\n")
        except OSError:
            pass
        raise
