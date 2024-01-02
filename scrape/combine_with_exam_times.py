import json

j = None

with open("scrape/courses_with_exam_type.json") as f:
    j = json.load(f)

with open("scrape/exam_times.csv") as f:
    for row in f:
        date, code, type = row.strip().split(",")

        if code not in j:
            continue

        if type == "Forberedelsesdag":
            j[code]["preparationDay"] = date
        else:
            dur = int(type[0])
            j[code]["examDuration"] = dur
            j[code]["examDate"] = date

markForDel = []

for code, course in j.items():
    # Remove courses with written exam without exam date
    if course["examType"] in [5, 6, 7, 8, 27] and "examDate" not in course:
        markForDel.append(code)

for code in markForDel:
    j.pop(code)

with open("docs/data.json", "w", encoding="utf-8") as f:
    json.dump(j, f)

