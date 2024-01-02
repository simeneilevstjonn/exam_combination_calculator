# This file accepts a list of course codes and filters out codes which are not the main code. It finds the types of exam available for each code

import requests
import json

codesFile = open("scrape/codes.csv", encoding="utf-8")

processedCodes = {}

API_URI_BASE = "https://data.udir.no/kl06/v201906/fagkoder/"

for line in codesFile:
    code, title = line.split(";")

    # Discard courses with an assessment form after comma in the title
    if ", muntlig" in title or ", skriftlig" in title or ", praktisk" in title:
        continue

    # Filter out some "fellesfag" that we do not want to include
    if code in ["NOR1267", "NOR1268", "NOR1269", "HIS1010", "REL1003", "KRO1019", "KRO1018", "KRO1017", "GEO1003", "SAK1001", "SPR3029"]:
        continue

    # Fetch from API
    rsp = requests.get(API_URI_BASE + code)

    if not rsp.ok:
        # Ignore errors
        #raise Exception("A non-200 response was sent.")
        continue
    
    j = rsp.json()

    # Check that course has correct type. We must allow "fellesfag" to allow German I + II or similar
    if j["fagtype"]["kode"] not in ["fagtype_valgfritt_programfag", "fagtype_fellesfag"]:
        continue

    # If this is not the main course
    if len(j["benyttes-sammen-med"]):
        continue


    course = {
        "code": code.strip(),
        "title": title,
        "examType": None,
        "fellesfag": j["fagtype"]["kode"] == "fagtype_fellesfag"
    }

    for vo in j["vurderingsordning"]:
        if vo["elevtype"] != "http://psi.udir.no/ontologi/eksamen_vurdering_elev":
            continue

        extype = vo["type-eksamensordning"]["kode"]

        # Filter courses without "normal" exam forms
        _, t = extype.split("_")
        t = int(t)
        if t in [3, 4, 5, 6, 7, 8, 13, 27]:
            course["examType"] = t

        # We assume that no other exam type shows up for "normal" courses

    if course["examType"] is not None:
        processedCodes[code] = course

f = open("scrape/courses_with_exam_type.json", "w", encoding="utf-8")
f.write(json.dumps(processedCodes))
f.close()



