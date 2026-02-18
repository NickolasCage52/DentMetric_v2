from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class NluResult:
    intent: str
    slots: dict


VIN_RE = re.compile(r"\b([A-HJ-NPR-Z0-9]{17})\b", re.IGNORECASE)
YEAR_RE = re.compile(r"\b(19[8-9]\d|20[0-3]\d)\b")
MILEAGE_RE = re.compile(r"\b(\d{1,3}(?:[ _.,]\d{3})+|\d{3,6})\s*(?:км|km)\b", re.IGNORECASE)


def classify_intent(message: str) -> str:
    m = message.lower()
    if any(k in m for k in ["то", "техобслуж", "техническое обслуживание", "масло", "свеч", "фильтр"]):
        return "to_service"
    if any(k in m for k in ["запчаст", "артикул", "каталог", "подбор", "купить", "прайс"]):
        return "parts_search"
    return "problem_symptom"


def extract_slots(message: str) -> dict:
    slots: dict = {}
    vin = _first_match(VIN_RE, message)
    if vin:
        slots["vin"] = vin.upper()

    year = _first_match(YEAR_RE, message)
    if year:
        slots["year"] = int(year)

    mileage = _first_match(MILEAGE_RE, message)
    if mileage:
        digits = re.sub(r"\D", "", mileage)
        if digits:
            slots["mileage_km"] = int(digits)

    # Minimal heuristics for brand/model: "brand model" at start (Latin/Cyrillic)
    tokens = re.split(r"\s+", message.strip())
    if len(tokens) >= 2:
        maybe_brand = tokens[0]
        maybe_model = tokens[1]
        if 2 <= len(maybe_brand) <= 32 and 1 <= len(maybe_model) <= 32:
            slots.setdefault("brand", maybe_brand)
            slots.setdefault("model", maybe_model)

    return slots


def build_questions(intent: str, slots: dict) -> list[str]:
    questions: list[str] = []
    need = _required_slots(intent)
    missing = [k for k in need if not slots.get(k)]

    for key in missing[:2]:
        if key == "vin":
            questions.append("Подскажите VIN (17 символов)?")
        elif key == "brand":
            questions.append("Какая марка автомобиля?")
        elif key == "model":
            questions.append("Какая модель автомобиля?")
        elif key == "year":
            questions.append("Какой год выпуска?")
        else:
            questions.append(f"Уточните {key}?")
    return questions


def _required_slots(intent: str) -> list[str]:
    if intent == "to_service":
        return ["brand", "model", "year"]
    if intent == "parts_search":
        return ["vin"]
    return ["brand", "model"]


def _first_match(rx: re.Pattern, text: str) -> str | None:
    m = rx.search(text or "")
    return m.group(1) if m else None

