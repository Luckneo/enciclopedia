import random

PREFIXES = ["Aer", "Bal", "Cor", "Dra", "El", "Fae", "Gor", "Hal", "Ily", "Kael", "Lor", "Mor", "Nym", "Ond", "Pry", "Qor", "Ryl", "Syl", "Tyr", "Ula", "Vyr", "Wyn", "Xyl", "Yen", "Zor"]
SUFFIXES = ["dor", "rion", "thas", "wyn", "lan", "gath", "mir", "zor", "vash", "tor", "nis", "las", "riel", "mar", "xar", "lyn", "zor"]
TITLES = ["el Justo", "Manoscuro", "Estrella del Norte", "el Quebrado", "Corazón Férreo", "Portador de Luz", "el Invencible", "Sangre de Dragón", "el Sabio", "Ojo de Cuervo"]
LOC_PREFIXES = ["Valle", "Monte", "Cañón", "Bosque", "Mar", "Páramo", "Cueva", "Templo"]
LOC_SUFFIXES = ["del Eco", "Sombrío", "Aullante", "de Cristal", "Olvidado", "de los Reyes", "Sin Retorno"]

def generate_character_name(include_title=True):
    length = random.randint(1, 2)
    name = "".join(random.choice(PREFIXES if i == 0 else SUFFIXES) for i in range(length + 1))
    if include_title and random.random() > 0.4:
        name += f" {random.choice(TITLES)}"
    return name.title() if not include_title else name

def generate_location_name():
    if random.random() > 0.5:
        # Ejemplo: Valle Sombrío
        return f"{random.choice(LOC_PREFIXES)} {random.choice(LOC_SUFFIXES)}"
    else:
        # Ejemplo: Elrion
        length = random.randint(1, 2)
        return "".join(random.choice(PREFIXES if i == 0 else SUFFIXES) for i in range(length + 1)).title()

def generate_specimen_name():
    # Para plantas y criaturas
    ADJS = ["Radiante", "Venenoso", "Gigante", "Menor", "Abismal", "Boreal", "Cenizo", "Escarlata"]
    NOUNS = ["Hongo", "Lobo", "Liquen", "Bestia", "Draco", "Árbol", "Loto", "Acechador"]
    return f"{random.choice(NOUNS)} {random.choice(ADJS)}"

def generate_npc_traits():
    RASGOS = [
        "Ciego de un ojo", "Tiene un brazo de latón rúnico", "Voz ronca y profunda", 
        "Lleva un grimorio encadenado a la espalda", "Viste ropajes de seda marchita", 
        "Silba al pronunciar las consonantes", "Usa una máscara de porcelana agrietada",
        "Posee una cicatriz en forma de runa", "Manos cubiertas de carbón y tiza",
        "Olor a azufre y lavanda fresca", "Mirada fija y desprovista de pestañeo"
    ]
    PERSO = [
        "Paranoico obsesivo", "Metódico e impasible", "Codicioso sin disimulo", 
        "Leal al extremo", "Educado pero implacable", "Melancólico", 
        "Embustero carismático", "Escéptico ante la magia", "Erudito arrogante",
        "Protector con los indefensos", "Obsesionado con la puntualidad"
    ]
    DEFECTO = [
        "Fobia paralizante a los insectos", "Deudas severas con el sindicato de ladrones", 
        "Sometido a una maldición de sombras", "Pérdida de memoria reciente",
        "Incapacidad absoluta para mentir", "Aversión extrema al agua profunda",
        "Vulnerable al frío debido a una herida de guerra antigua"
    ]
    MOTIV = [
        "Vengar la muerte de su mentor", "Descifrar un manuscrito arcano", 
        "Acumular riquezas para comprar su libertad", "Proteger su aldea de un cataclismo",
        "Encontrar al hermano perdido en el plano etéreo", "Restaurar el honor de su linaje",
        "Destruir una reliquia corrupta que amenaza la región"
    ]
    
    return f"✨ Apariencia: {random.choice(RASGOS)}\n🧠 Personalidad: {random.choice(PERSO)}\n⚠️ Debilidad/Defecto: {random.choice(DEFECTO)}\n🎯 Motivación: {random.choice(MOTIV)}"
