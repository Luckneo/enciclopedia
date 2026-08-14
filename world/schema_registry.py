"""Validación central de los identificadores físicos de la enciclopedia."""

import re

_TABLE_NAME = re.compile(r"^p_(?P<planet_id>[1-9]\d*)_[a-z0-9_]+$")


def validate_planet_table(table_name: str, planet_id: int) -> str:
    """Devuelve un nombre de tabla verificado o rechaza metadatos corruptos."""
    match = _TABLE_NAME.fullmatch(table_name)
    if not match or int(match.group("planet_id")) != planet_id:
        raise ValueError(f"Tabla no válida para el planeta {planet_id}: {table_name!r}")
    return table_name
