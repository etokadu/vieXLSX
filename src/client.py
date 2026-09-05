from datetime import datetime

from generator import ExcelGenerator, Task


class TodoClient:

    def __init__(self, path="todo.xlsx"):
        self.generator = ExcelGenerator(path)
        self.dirty = False
        self.lastSaveStatus = True

    def _sync(self):
        if self.dirty:
            return True

        return self.generator.syncFromExcel()

    def addTask(
        self,
        title,
        description="",
        status="todo",
        priority="normal",
        due_date="",
        category="",
        tags=""
    ):
        try:
            if not self._sync() or not title.strip():
                return None

            task = Task(
                id=self.generator.nextId(),
                title=title.strip(),
                done=status.strip().lower() in (
                    "done",
                    "completed",
                    "complete"
                ),
                description=description.strip(),
                status=status.strip().lower(),
                priority=priority.strip().lower(),
                due_date=due_date.strip(),
                category=category.strip(),
                tags=tags.strip(),
                created_time=datetime.now().isoformat(
                    timespec="seconds"
                )
            )
            self.generator.tasks.append(task)
            self.dirty = True
            self.lastSaveStatus = False
            return task
        except Exception:
            return None

    def save(self):
        try:
            self.lastSaveStatus = self.generator.updateExcel()
            if self.lastSaveStatus:
                self.dirty = False
            return self.lastSaveStatus
        except Exception:
            self.lastSaveStatus = False
            return False

    def markChanged(self):
        self.dirty = True
        self.lastSaveStatus = False

    def listTasks(self):
        if self.dirty:
            return list(self.generator.tasks)

        if not self._sync():
            return None

        return list(self.generator.tasks)

    def search(self, query):
        if not self._sync():
            return None

        return self.generator.searchTasks(query)

    def sort(self, field, reverse=False):
        if not self._sync():
            return False

        return self.generator.sortTasks(field, reverse)

    def filter(self, criteria):
        if not self._sync():
            return None

        return self.generator.filterTasks(criteria)

    def complete(self, task_id):
        try:
            if not self._sync():
                return False

            for task in self.generator.tasks:
                if task.id == int(task_id):
                    task.done = True
                    task.status = "done"
                    task.completed_time = datetime.now().isoformat(
                        timespec="seconds"
                    )
                    self.dirty = True
                    return self.save()

            return False
        except Exception:
            return False

    def delete(self, task_id):
        try:
            if not self._sync():
                return False

            old_length = len(self.generator.tasks)
            self.generator.tasks = [
                task
                for task in self.generator.tasks
                if task.id != int(task_id)
            ]

            if len(self.generator.tasks) == old_length:
                return False

            self.dirty = True
            return self.save()
        except Exception:
            return False
