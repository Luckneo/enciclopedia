import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from world.repository import SQLiteWorldRepository
from world.schema_registry import validate_planet_table


class WorldRepositoryTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "world.db"
        with closing(sqlite3.connect(self.db_path)) as connection:
            connection.execute(
                "CREATE TABLE planets (id INTEGER PRIMARY KEY, name TEXT, image_path TEXT, is_favorite INTEGER)"
            )
            connection.execute(
                "CREATE TABLE categories (id INTEGER PRIMARY KEY, planet_id INTEGER, name TEXT, table_name TEXT)"
            )
            connection.execute("CREATE TABLE p_1_criaturas (id INTEGER PRIMARY KEY, Nombre TEXT)")
            connection.execute("INSERT INTO planets VALUES (1, 'Eryndor', '', 1)")
            connection.execute("INSERT INTO categories VALUES (1, 1, 'Criaturas', 'p_1_criaturas')")
            connection.executemany("INSERT INTO p_1_criaturas(Nombre) VALUES (?)", [('A',), ('B',)])
            connection.commit()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_overview_counts_real_records(self):
        overview = SQLiteWorldRepository(self.db_path).overview()
        self.assertEqual(overview["planetCount"], 1)
        self.assertEqual(overview["categoryCount"], 1)
        self.assertEqual(overview["recordCount"], 2)
        self.assertEqual(overview["planets"][0]["name"], "Eryndor")

    def test_overview_reuses_cache_while_database_is_unchanged(self):
        repository = SQLiteWorldRepository(self.db_path)
        first = repository.overview()
        with patch.object(repository, "_connect", side_effect=AssertionError("cache miss")):
            second = repository.overview()
        self.assertEqual(first, second)
        self.assertIsNot(first, second)

    def test_registry_rejects_cross_planet_table(self):
        with self.assertRaises(ValueError):
            validate_planet_table("p_2_criaturas", 1)

    def test_browse_category_is_paginated_and_searchable(self):
        repository = SQLiteWorldRepository(self.db_path)
        first = repository.browse_category(1, 1, page_size=1)
        self.assertEqual(first["records"], [{"id": 1, "Nombre": "A"}])
        self.assertTrue(first["hasMore"])

        filtered = repository.browse_category(1, 1, query="B")
        self.assertEqual(filtered["records"], [{"id": 2, "Nombre": "B"}])
        self.assertFalse(filtered["hasMore"])

    def test_browse_rejects_unknown_category(self):
        with self.assertRaises(LookupError):
            SQLiteWorldRepository(self.db_path).browse_category(1, 999)


if __name__ == "__main__":
    unittest.main()
