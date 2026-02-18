from app.domain.nlu import build_questions, classify_intent, extract_slots


def test_intent_to_service():
    assert classify_intent("Нужно ТО, масло и фильтр") == "to_service"


def test_intent_parts_search():
    assert classify_intent("Нужны запчасти, подбор по VIN") == "parts_search"


def test_intent_problem_symptom_default():
    assert classify_intent("Стучит подвеска на кочках") == "problem_symptom"


def test_extract_vin_year_mileage():
    slots = extract_slots("Toyota Camry 2019 VIN JH4TB2H26CC000000 пробег 123 000 км")
    assert slots["vin"] == "JH4TB2H26CC000000"
    assert slots["year"] == 2019
    assert slots["mileage_km"] == 123000
    assert slots["brand"].lower() == "toyota"
    assert slots["model"].lower() == "camry"


def test_questions_max_2():
    questions = build_questions("to_service", slots={})
    assert len(questions) == 2

