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

with open("docs/data.json", "w", encoding="utf-8") as f:
    json.dump(j, f)

