"""Módulo profundo de lectura del mundo almacenado en SQLite."""

from __future__ import annotations

import sqlite3
import threading
from contextlib import closing
from copy import deepcopy
from pathlib import Path
from typing import Any

from .schema_registry import validate_planet_table


class SQLiteWorldRepository:
    """Expone casos de uso sin filtrar tablas, SQL ni conexiones a la interfaz."""

    def __init__(self, database_path: str | Path):
        self.database_path = Path(database_path).resolve()
        if not self.database_path.is_file():
            raise FileNotFoundError(f"No existe la base de datos: {self.database_path}")
        self._overview_cache: dict[str, Any] | None = None
        self._overview_stamp: tuple[int, int] | None = None
        self._cache_lock = threading.Lock()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(f"file:{self.database_path}?mode=ro", uri=True)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA query_only = ON")
        connection.execute("PRAGMA busy_timeout = 3000")
        return connection

    def overview(self) -> dict[str, Any]:
        """Resume mundos, categorías y registros usando únicamente metadatos confiables."""
        stat = self.database_path.stat()
        stamp = (stat.st_mtime_ns, stat.st_size)
        with self._cache_lock:
            if self._overview_cache is not None and self._overview_stamp == stamp:
                return deepcopy(self._overview_cache)

        with closing(self._connect()) as connection:
            planets = connection.execute(
                "SELECT id, name, image_path, is_favorite FROM planets ORDER BY id"
            ).fetchall()
            result: list[dict[str, Any]] = []
            total_categories = 0
            total_records = 0

            for planet in planets:
                categories = connection.execute(
                    "SELECT id, name, table_name FROM categories WHERE planet_id=? ORDER BY id",
                    (planet["id"],),
                ).fetchall()
                category_items: list[dict[str, Any]] = []
                for category in categories:
                    table_name = validate_planet_table(category["table_name"], planet["id"])
                    quoted_table = table_name.replace('"', '""')
                    count = connection.execute(
                        f'SELECT COUNT(*) FROM "{quoted_table}"'
                    ).fetchone()[0]
                    category_items.append(
                        {"id": category["id"], "name": category["name"], "recordCount": count}
                    )
                    total_records += count

                total_categories += len(category_items)
                result.append(
                    {
                        "id": planet["id"],
                        "name": planet["name"],
                        "imagePath": planet["image_path"] or None,
                        "favorite": bool(planet["is_favorite"]),
                        "recordCount": sum(item["recordCount"] for item in category_items),
                        "categories": category_items,
                    }
                )

        overview = {
            "mode": "local-readonly",
            "database": self.database_path.name,
            "planetCount": len(result),
            "categoryCount": total_categories,
            "recordCount": total_records,
            "planets": result,
        }
        with self._cache_lock:
            self._overview_cache = overview
            self._overview_stamp = stamp
        return deepcopy(overview)

    def browse_category(
        self,
        planet_id: int,
        category_id: int,
        *,
        query: str = "",
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        """Devuelve una página acotada sin exponer detalles del esquema físico."""
        if planet_id < 1 or category_id < 1:
            raise ValueError("Los identificadores deben ser positivos")
        if page < 1 or page > 10_000:
            raise ValueError("La página debe estar entre 1 y 10000")
        if page_size < 1 or page_size > 100:
            raise ValueError("El tamaño de página debe estar entre 1 y 100")

        cleaned_query = query.strip()[:120]
        with closing(self._connect()) as connection:
            category = connection.execute(
                "SELECT name, table_name FROM categories WHERE id=? AND planet_id=?",
                (category_id, planet_id),
            ).fetchone()
            if category is None:
                raise LookupError("La categoría no existe en este planeta")

            table_name = validate_planet_table(category["table_name"], planet_id)
            quoted_table = table_name.replace('"', '""')
            column_rows = connection.execute(f'PRAGMA table_info("{quoted_table}")').fetchall()
            columns = [row["name"] for row in column_rows]
            if not columns:
                raise LookupError("La categoría no tiene columnas consultables")

            metadata_columns = {"parent_id", "image_path", "is_favorite"}
            preferred = ("Nombre", "Nombre_Completo", "Nombre Común", "name", "Título", "Titulo")
            title_column = next((name for name in preferred if name in columns), None)
            if title_column is None:
                title_column = next(
                    (
                        row["name"]
                        for row in column_rows
                        if "TEXT" in (row["type"] or "").upper() and row["name"] not in metadata_columns
                    ),
                    columns[0],
                )

            selected_columns = [name for name in columns if name not in metadata_columns][:12]
            quoted_columns = ", ".join(f'"{name.replace(chr(34), chr(34) * 2)}"' for name in selected_columns)
            title_identifier = title_column.replace('"', '""')
            where = ""
            parameters: list[Any] = []
            if cleaned_query:
                where = f' WHERE CAST("{title_identifier}" AS TEXT) LIKE ? ESCAPE \'\\\''
                escaped = cleaned_query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
                parameters.append(f"%{escaped}%")

            offset = (page - 1) * page_size
            parameters.extend((page_size + 1, offset))
            rows = connection.execute(
                f'SELECT {quoted_columns} FROM "{quoted_table}"{where} ORDER BY id LIMIT ? OFFSET ?',
                parameters,
            ).fetchall()
            has_more = len(rows) > page_size
            page_rows = rows[:page_size]

        return {
            "planetId": planet_id,
            "categoryId": category_id,
            "categoryName": category["name"],
            "titleColumn": title_column,
            "columns": selected_columns,
            "page": page,
            "pageSize": page_size,
            "hasMore": has_more,
            "query": cleaned_query,
            "records": [{name: row[name] for name in selected_columns} for row in page_rows],
        }
