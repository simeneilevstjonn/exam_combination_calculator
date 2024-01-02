import json
import requests

URI = "https://www.udir.no/api/NyeFagkoder"

results = []

totNum = 25
fetched = 0
i = 1

while fetched < totNum:
    req = {
        "checkedValues": [],
        "currentPageNumber": i
    }

    rsp = requests.post(URI, json = req)

    if not rsp.ok:
        raise Exception("A non-200 response was sent.")
    
    j = rsp.json()

    if not j["success"]:
        raise Exception("JSON success not set.")
    
    totNum = j["payload"]["numberOfResults"]

    fetched += len(j["payload"]["results"])

    results += j["payload"]["results"]

    i += 1

# Create dump of codes and names
file = open("scrape/codes.csv", "w", encoding="utf-8")
file.writelines(result["newSubject"]["code"] + ";" + result["newSubject"]["title"] + "\n" for result in results)
file.close()
