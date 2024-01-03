let courses;
let activeCourses = [];
let activeCodes = [];

const secondChoiceFormCourse = {
    title: "Norsk sidemål, vg3 studieforberedende utdanningsprogram, skriftlig",
    code: "NOR1268",
    examType: 5,
    examDate: "2024-05-21",
    fellesfag: true,
    examDuration: 5
};

const firstChoiceFormCourse = {
    title: "Norsk hovedmål, vg3 studieforberedende utdanningsprogram, skriftlig",
    code: "NOR1267",
    examType: 5,
    examDate: "2024-05-22",
    fellesfag: true,
    examDuration: 5
};

const commonOralCourses = [
    {
        title: "Norsk, vg3 studieforberedende utdanningsprogram, muntlig",
        code: "NOR1269",
        examType: 13,
        fellesfag: true
    },
    {
        title: "Historie Vg3 studieforberedende utdanningsprogram",
        code: "HIS1010",
        examType: 13,
        fellesfag: true
    },
    {
        title: "Religion og etikk",
        code: "REL1003",
        examType: 13,
        fellesfag: true
    }
]

let noSecondChoiceForm = false;

const courseExamTypes = {
    3: "muntlig-praktisk",
    4: "praktisk",
    5: "skriftlig",
    6: "skriftlig eller muntlig",
    7: "skriftlig eller muntlig-praktisk",
    8: "skriftlig og/eller muntlig",
    13: "muntlig",
    27: "skriftlig og/eller muntlig-praktisk"
};

const courseOralExamTypes = {
    3: "muntlig-praktisk",
    4: "praktisk",
    6: "muntlig",
    7: "muntlig-praktisk",
    8: "muntlig",
    13: "muntlig",
    27: "muntlig-praktisk"
}

const writtenExamTypes = [5, 6, 7, 8, 27];
const oralOrOtherwiseExamTypes = [3, 4, 6, 7, 8, 13, 27];
const excludesOralIfWrittenExamTypes = [6, 7];
const allowsBothOralAndWrittenExamTypes = [8, 27];

async function fetchCourses() {
    let courses;

    let response = await fetch("data.json");

    if (response.status == 200) {
        courses = await response.json();
    }

    return courses;
}

async function init() {
    courses = await fetchCourses();

    const dl = document.getElementById("courseInputDatalist");

    for (const code in courses) {
        if (!courses.hasOwnProperty(code)) continue;

        const course = courses[code];

        const el = document.createElement("option");
        el.value = code;
        el.innerText = course.title;

        dl.appendChild(el);
    }
}

function findOverlaps(a, b) {
    const ols = [];

    // a exam b exam
    if (a.examDate !== undefined && b.examDate !== undefined && a.examDate == b.examDate) {
        ols.push(`Eksamen overlapper med eksamen i ${b.title} (${b.code})`);
    }

    // a exam b prep
    if (a.examDate !== undefined && b.preparationDay !== undefined && a.examDate == b.preparationDay) {
        ols.push(`Eksamen overlapper med forberedelsesdag i ${b.title} (${b.code})`);
    }

    // a prep b prep
    if (a.preparationDay !== undefined && b.preparationDay !== undefined && a.preparationDay == b.preparationDay) {
        ols.push(`Forberedelsesdag overlapper med forberedelsesdag i ${b.title} (${b.code})`);
    }

    // a prep b exam
    if (a.preparationDay !== undefined && b.examDate !== undefined && a.preparationDay == b.examDate) {
        ols.push(`Forberedelsesdag overlapper med eksamen i ${b.title} (${b.code})`);
    }


    return ols;
}

function renderCourses() {
    const wrapper = document.getElementById("chosen-courses");

    wrapper.innerHTML = "";

    let coursesToRender = activeCourses;
    if (!noSecondChoiceForm) coursesToRender = [secondChoiceFormCourse].concat(activeCourses);

    for (const course of coursesToRender) {
        const card = document.createElement("div");
        card.className = "card m-2 p-2";

        if (course.code != "NOR1268")
            card.innerHTML = `
            <div style="position: absolute; top: 0; right: 0;">
                <button class="btn" onclick="removeCourse('${course.code}')">
                    <i class="fa-solid fa-trash text-danger"></i>
                </button>
            </div>`;
        

        const title = document.createElement("h6");
        title.classList.add("card-title");
        title.innerText = `${course.title} (${course.code})`;
        card.appendChild(title);

        const body = document.createElement("div");
        body.className = "card-body p-0";
        card.appendChild(body);

        const dateInfo = document.createElement("p");
        let di = `Faget har eksamensordning ${courseExamTypes[course.examType]}.`;

        // If skriftlig, add date
        if (writtenExamTypes.indexOf(course.examType) >= 0) {
            di += ` Skriftlig eksamen er ${course.examDate} og varer i ${course.examDuration} timer.`;

            if (course.preparationDay !== undefined)
                di += ` Eksamen har forberedelsesdag ${course.preparationDay}.`
        }

        dateInfo.innerText = di;
        body.appendChild(dateInfo);

        // Find overlaps
        let overlaps = [];

        for (const other of activeCourses) {
            if (other != course) overlaps = overlaps.concat(findOverlaps(course, other));
        }

        if (overlaps.length > 0) {
            const overlapTitle = document.createElement("p");
            overlapTitle.innerText = "Overlapp";
            body.appendChild(overlapTitle);

            const overlapsList = document.createElement("ul");
            
            for (const ol of overlaps) {
                const el = document.createElement("li");
                el.innerText = ol;
                overlapsList.append(el);
            }

            body.appendChild(overlapsList);
        }

        wrapper.appendChild(card);
    }
}

function addCourse(code) {
    if (!(code in courses)) return;
    if (activeCodes.indexOf(code) >= 0) return;
    if (activeCodes.length > 3) return;

    activeCodes.push(code);
    activeCourses.push(courses[code])

    document.getElementById("courseInputDatalist").removeChild(
        document.querySelector(`option[value="${code}"]`)
    );

    document.getElementById("courseInput").disabled = activeCodes.length > 3;

    renderCourses();
}

function removeCourse(code) {
    if (!(code in courses)) return;
    if (activeCodes.indexOf(code) < 0) return;

    activeCodes.splice(
        activeCodes.indexOf(code),
        1
    );
    activeCourses.splice(
        activeCourses.indexOf(courses[code]),
        1
    );
    
    // Re-insert the datalist option
    const course = courses[code];

    const el = document.createElement("option");
    el.value = code;
    el.innerText = course.title;

    document.getElementById("courseInputDatalist").appendChild(el);

    document.getElementById("courseInput").disabled = activeCodes.length > 3;

    renderCourses();
}

function addCourseFromInput() {
    const inpt = document.getElementById("courseInput");

    addCourse(inpt.value);
    
    inpt.value = "";
}

document.getElementById("courseInput").addEventListener("change", () => {
    addCourseFromInput();
});

function setSecondChoiceState(state) {
    noSecondChoiceForm = state;

    renderCourses();
}

function renderCombinations(combinations) {
    const list = document.getElementById("possibleWrittenCombinations");

    for (const comb of combinations) {
        const ca = comb[0];
        const cb = comb[1];
        const el = document.createElement("li");
        el.innerText = `${ca.title} (${ca.code}), ${cb.title} (${cb.code})`;
        list.appendChild(el);
    }
}

function calculateOralFrequencies(possibleOralCourses, courseCombinations) {
    const frequencies = {};

    // Applies only in the standard case where 1 oral exam is chosen
    for (const comb of courseCombinations) {
        let count = 0;


        for (const course of possibleOralCourses) {
            count += !(excludesOralIfWrittenExamTypes.indexOf(course.examType) >= 0 && (comb[0] == course || comb[1] == course))
        }


        for (const course of possibleOralCourses) {
            if (!(excludesOralIfWrittenExamTypes.indexOf(course.examType) >= 0 && (comb[0] == course || comb[1] == course))) {
                if (course.code in frequencies)
                    frequencies[course.code] += 1 / count / courseCombinations.length;
                else 
                    frequencies[course.code] = 1 / count / courseCombinations.length;
            }
        }
    }

    return frequencies;
}

function calculateOralFrequenciesForOneEdgeCase(possibleOralCourses, possibleWrittenCourses) {
    const frequencies = {};
    let count = 0;

    for (const wcourse of possibleWrittenCourses) {
        for (let i = 0; i < possibleOralCourses.length; i++) {
            const ca = possibleOralCourses[i];
            if ((excludesOralIfWrittenExamTypes.indexOf(ca.examType) >= 0 && wcourse == ca))
                continue;

            for (let j = i + 1; j < possibleOralCourses.length; j++) {
                const cb = possibleOralCourses[j];
                if ((excludesOralIfWrittenExamTypes.indexOf(cb.examType) >= 0 && wcourse == cb))
                    continue;

                if (ca.code in frequencies)
                    frequencies[ca.code] += 1;
                else 
                    frequencies[ca.code] = 1;

                if (cb.code in frequencies)
                    frequencies[cb.code] += 1;
                else 
                    frequencies[cb.code] = 1;

                count += 1;
            }
        }
    }

    for (const code in frequencies) {
        if (!frequencies.hasOwnProperty(code)) continue;

        frequencies[code] /= count;
    }

    return frequencies;
}

function calculateOralFrequenciesForNoneEdgeCase(possibleOralCourses) {
    const frequencies = {};
    let count = 0;

    for (let i = 0; i < possibleOralCourses.length; i++) {
        const ca = possibleOralCourses[i];

        for (let j = i + 1; j < possibleOralCourses.length; j++) {
            const cb = possibleOralCourses[j];
            
            for (let k = j + 1; k < possibleOralCourses.length; k++) {
                const cc = possibleOralCourses[k];

                if (ca.code in frequencies)
                frequencies[ca.code] += 1;
                else 
                    frequencies[ca.code] = 1;

                if (cb.code in frequencies)
                    frequencies[cb.code] += 1;
                else 
                    frequencies[cb.code] = 1;

                if (cc.code in frequencies)
                    frequencies[cc.code] += 1;
                else 
                    frequencies[cc.code] = 1;

                count += 1;
            }
        }
    }

    for (const code in frequencies) {
        if (!frequencies.hasOwnProperty(code)) continue;

        frequencies[code] /= count;
    }

    return frequencies;
}

function findOralAndWrittenCombinations(possibleOralCourses, courseCombinations) {
    const combinations = [];

    // Applies only in the standard case where 1 oral exam is chosen
    for (const comb of courseCombinations) {
        for (const course of possibleOralCourses) {
            if (!(excludesOralIfWrittenExamTypes.indexOf(course.examType) >= 0 && (comb[0] == course || comb[1] == course))) {
                combinations.push([[comb[0], false], [comb[1], false], [course, true]]);
            }
        }
    }

    return combinations;
}

function findOralAndWrittenCombinationsForOneEdgeCase(possibleOralCourses, possibleWrittenCourses) {
    const combinations = [];


    for (const wcourse of possibleWrittenCourses) {
        for (let i = 0; i < possibleOralCourses.length; i++) {
            const ca = possibleOralCourses[i];
            if ((excludesOralIfWrittenExamTypes.indexOf(ca.examType) >= 0 && wcourse == ca))
                continue;

            for (let j = i + 1; j < possibleOralCourses.length; j++) {
                const cb = possibleOralCourses[j];
                if ((excludesOralIfWrittenExamTypes.indexOf(cb.examType) >= 0 && wcourse == cb))
                    continue;

                combinations.push([[wcourse, false], [ca, true], [cb, true]]);
            }
        }
    }

    return combinations;
}

function findOralAndWrittenCombinationsForNoneEdgeCase(possibleOralCourses) {
    const combinations = [];

    for (let i = 0; i < possibleOralCourses.length; i++) {
        const ca = possibleOralCourses[i];

        for (let j = i + 1; j < possibleOralCourses.length; j++) {
            const cb = possibleOralCourses[j];
            
            for (let k = j + 1; k < possibleOralCourses.length; k++) {
                const cc = possibleOralCourses[k];

                combinations.push([[ca, true], [cb, true], [cc, true]]);
            }
        }
    }

    return combinations;

}

function findCourseInArray(courses, code) {
    for (const course of courses) {
        if (course.code == code) return course;
    }

    return null;
}

function addExpectancyRow(title, value) {
    const expectanciesTbody = document.getElementById("expectanciesTbody");

    const row = document.createElement("tr");
    const titleCell = document.createElement("td");
    titleCell.textContent = title;
    row.appendChild(titleCell);

    const expCell = document.createElement("td");
    expCell.textContent = Math.round(value * 10) / 10;
    row.appendChild(expCell);

    expectanciesTbody.appendChild(row);
}

function clearCalendar() {
    for (const element of document.getElementsByClassName("calendar-body")) {
        if (element.getAttribute("data-calendar-date") != "2024-05-22")
            element.innerHTML = "";
    }
}

function calculateAndRenderTotalExpectanciesAndProbabilities(oralFrequencies, writtenFrequencies, courseCombinations, possibleOralCourses) {
    const expectancies = {};

    for (const code in oralFrequencies) {
        if (!oralFrequencies.hasOwnProperty(code)) continue;

        if (code in expectancies)
            expectancies[code] += oralFrequencies[code];
        else
            expectancies[code] = oralFrequencies[code];
    }

    for (const code in writtenFrequencies) {
        if (!writtenFrequencies.hasOwnProperty(code)) continue;

        if (code in expectancies)
            expectancies[code] += writtenFrequencies[code];
        else
            expectancies[code] = writtenFrequencies[code];
    }

    const rows = [];

    for (const code in expectancies) {
        if (!expectancies.hasOwnProperty(code)) continue;

        let course;
        
        if (code in courses)
            course = courses[code];
        else if (code == "NOR1268")
            course = secondChoiceFormCourse;
        else 
            course = findCourseInArray(commonOralCourses, code);

        const name = `${course.title} (${course.code})`;
        const expectancy = Math.floor(expectancies[code] * 100) / 100;

        let probability = expectancies[code];

        // P(A \cup B) = P(A) + P(B) - P(A \cap B) = P(A) + P(B) - P(B | A) * P(A)
        // If course permits both oral and written, P(A \cap B) != 0, hence more simulation must be done

        if (allowsBothOralAndWrittenExamTypes.indexOf(course.examType) >= 0) {
            let simFreq;
            // Base case
            if (courseCombinations.length > 0) {
                const allowedCombinations = courseCombinations.filter((comb) => comb[0] == course || comb[1] == course );

                simFreq = calculateOralFrequencies(possibleOralCourses, allowedCombinations);

            }
            // Edge case One, Edge case None will never occur
            else {
                simFreq = calculateOralFrequenciesForOneEdgeCase(possibleOralCourses, [course]);
            }

            probability -= simFreq[code] * writtenFrequencies[code];

        }

        probability = Math.floor(probability * 100) + "%";

        rows.push([name, expectancy, probability]);
    }

    rows.sort((a, b) => b[1] - a[1]);

    const tbody = document.getElementById("totalExpectanciesTbody");
    tbody.innerHTML = "";

    for (const row of rows) {
        const tr = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = row[0];
        tr.appendChild(nameCell);

        const probCell = document.createElement("td");
        probCell.textContent = row[2];
        tr.appendChild(probCell);

        const expectCell = document.createElement("td");
        expectCell.textContent = row[1];
        tr.appendChild(expectCell);

        

        tbody.appendChild(tr);
    }
}

function std(vals) {
    const n = vals.length;

    let sum = 0;

    for (const v of vals) {
        sum += v;
    }

    const mean = sum / n;

    let sqsum = 0;

    for (const v of vals) {
        sqsum += (v - mean)**2;
    }

    return (sqsum / (n - 1))**.5;
}

class GradeEstimationCourse {
    constructor(course, frequency, isOral, calculator) {
        this.course = course;
        this.frequency = frequency;
        this.isOral = isOral;
        this.calculator = calculator;

        this.examType = isOral ? courseOralExamTypes[course.examType] : "skriftlig";

        this.expectedGrade = 0;
    }

    render(parent) {
        const row = document.createElement("tr");
        
        const titleCell = document.createElement("td");
        titleCell.textContent = `${this.course.title} (${this.course.code}), ${this.examType}`;
        row.appendChild(titleCell);

        const inputCell = document.createElement("td");
        this.input = document.createElement("input");
        this.input.type = "number";
        this.input.min = 1;
        this.input.max = 6;
        this.input.className = "form-control";
        inputCell.appendChild(this.input);
        row.appendChild(inputCell);

        this.input.addEventListener("change", this.updateEventHandler.bind(this));

        this.contributionCell = document.createElement("td");
        this.contributionCell.innerText = 0;
        row.appendChild(this.contributionCell);

        parent.appendChild(row);    
    }

    contribution() {
        return this.expectedGrade * this.frequency;
    }

    updateEventHandler() {
        const val = parseFloat(this.input.value);

        if (isNaN(val) || val < 1 || val > 6) return;

        this.expectedGrade = val;

        const contrib = Math.round(this.contribution() * 100) / 100;

        this.contributionCell.innerText = contrib;

        this.calculator.updateEventHandler();
    }
}

class GradeEstimationCalculator {
    constructor(oralFrequencies, writtenFrequencies, possibleWrittenCourses, possibleOralCourses, oralAndWrittenCombinations) {
        this.courses = [];

        this.parent = document.getElementById("gradeEstimateTbody");
        this.parent.innerHTML = "";

        this.oralAndWrittenCombinations = oralAndWrittenCombinations;

        this.resultTable = document.getElementById("gradeEstimateResultsTbody");

        const nor = new GradeEstimationCourse(firstChoiceFormCourse, 1, false, this);
        nor.render(this.parent);
        this.courses.push(nor);

        for (const course of possibleWrittenCourses) {
            const c = new GradeEstimationCourse(course, writtenFrequencies[course.code], false, this);
            c.render(this.parent);
            this.courses.push(c);
        }

        for (const course of possibleOralCourses) {
            const c = new GradeEstimationCourse(course, oralFrequencies[course.code], true, this);
            c.render(this.parent);
            this.courses.push(c);
        }

        document.getElementById("gradeEstimateHistogram").innerHTML = "";
        document.getElementById("gradeEstimateHistogram").style.display = "none";
        this.histogram = new google.visualization.Histogram(document.getElementById("gradeEstimateHistogram"));

        this.renderResults();
    }

    addResultTableRow(category, value) {
        const row = document.createElement("tr");
        const catCell = document.createElement("td");
        catCell.textContent = category;
        row.appendChild(catCell);

        const valCell = document.createElement("td");
        valCell.textContent = value;
        row.appendChild(valCell);

        this.resultTable.appendChild(row);
    }

    findCourseByCodeAndIsOral(code, isOral) {
        for (const course of this.courses) {
            if (course.course.code == code && course.isOral == isOral) return course;
        }
        return null;
    }

    findAllGradeAverages() {
        const avgs = [];

        for (const comb of this.oralAndWrittenCombinations) {
            const _courses = comb.map((x) => this.findCourseByCodeAndIsOral(x[0].code, x[1]));

            let sum = this.findCourseByCodeAndIsOral("NOR1267", false).expectedGrade;
            
            for (const course of _courses) {
                sum += course.expectedGrade;
            }

            avgs.push(sum / 4);
        }

        return avgs;
    }

    findAllGradeAveragesWithLabels() {
        const avgs = [];

        for (const comb of this.oralAndWrittenCombinations) {
            const _courses = comb.map((x) => this.findCourseByCodeAndIsOral(x[0].code, x[1]));

            let sum = this.findCourseByCodeAndIsOral("NOR1267", false).expectedGrade;

            const label = _courses.map((x) => `${x.course.code} (${x.examType})`).join(", ");
            
            for (const course of _courses) {
                sum += course.expectedGrade;
            }

            avgs.push([label, sum / 4]);
        }

        return avgs;
    }

    renderHistogram() {
        const data = this.findAllGradeAveragesWithLabels();
        var dataTable = google.visualization.arrayToDataTable(
            [["Kombinasjon", "Karaktergjennomsnitt"]].concat(data)
        );

        var options = {
            title: "Karaktergjennomsnitt per 3-fag-kombinasjon",
            legend: {
                position: "none"
            }
        };

        document.getElementById("gradeEstimateHistogram").style.display = "";
        this.histogram.draw(dataTable, options);
    }

    renderResults() {
        this.resultTable.innerHTML = "";

        let sum = 0;

        for (const course of this.courses) {
            sum += course.contribution();

            // Do not display incomplete data if input has not completed
            if (course.contribution() == 0) {
                sum = 0;
                break;
            }
        }

        this.addResultTableRow("Forventet karaktersum", Math.round(sum * 100) / 100);
        this.addResultTableRow("Forventet karaktergjennomsnitt", Math.round(sum * 25) / 100);

        let stdDev = 0;

        if (sum != 0) {
            const avgs = this.findAllGradeAverages();

            stdDev = std(avgs);

            this.renderHistogram();
        }

        this.addResultTableRow("Utvalgsstandardavvik karaktergjennomsnitt", Math.round(stdDev * 100) / 100);

    }

    updateEventHandler() {
        this.renderResults();
    }
}

function runCalculator() {
    // Find all possible combinations between two courses for a written exam
    let courseCombinations = [];

    let possibleCourses = activeCourses;
    if (!noSecondChoiceForm) possibleCourses = [secondChoiceFormCourse].concat(activeCourses);

    for (let i = 0; i < possibleCourses.length; i++) {
        const ca = possibleCourses[i];
        if (writtenExamTypes.indexOf(ca.examType) >= 0) {
            for (let j = i + 1; j < possibleCourses.length; j++) {
                const cb = possibleCourses[j];
                if (writtenExamTypes.indexOf(cb.examType) >= 0 && findOverlaps(ca, cb).length == 0) {
                    courseCombinations.push([ca, cb]);
                }
            }
        }
    }

    const possibleOralList = document.getElementById("possibleOral");
    const possibleWrittenList = document.getElementById("possibleWritten");

    possibleOralList.innerHTML = "";
    possibleWrittenList.innerHTML = "";

    const possibleOralCourses = [];
    const possibleWrittenCourses = [];

    for (const course of possibleCourses.concat(commonOralCourses)) {
        if (writtenExamTypes.indexOf(course.examType) >= 0) {
            const el = document.createElement("li");
            el.textContent = `${course.title} (${course.code})`;
            possibleWrittenCourses.push(course);
            possibleWrittenList.appendChild(el);
        }

        if (oralOrOtherwiseExamTypes.indexOf(course.examType) >= 0) {
            const el = document.createElement("li");
            el.textContent = `${course.title} (${course.code})`;
            possibleOralCourses.push(course);
            possibleOralList.appendChild(el);
        }
    }

    // Clear edge case notices
    const edgeCaseNoticeNone = document.getElementById("edge-case-notice-none");
    const edgeCaseNoticeOne = document.getElementById("edge-case-notice-one");
    const edgeCaseNoticePrep = document.getElementById("edge-case-notice-prep");

    edgeCaseNoticeNone.style.display = "none";
    edgeCaseNoticeOne.style.display = "none";
    edgeCaseNoticePrep.style.display = "none";

    // Edge case where there are multiple courses, but they overlap with preparation day.
    if (possibleWrittenCourses.length > 1 && courseCombinations.length == 0) {
        for (let i = 0; i < possibleCourses.length; i++) {
            const ca = possibleCourses[i];
            if (writtenExamTypes.indexOf(ca.examType) >= 0) {
                for (let j = i + 1; j < possibleCourses.length; j++) {
                    const cb = possibleCourses[j];
                    if (writtenExamTypes.indexOf(cb.examType) >= 0 && ca.examDate != cb.examDate) {
                        courseCombinations.push([ca, cb]);
                    }
                }
            }
        }

        if (courseCombinations.length > 0) 
            edgeCaseNoticePrep.style.display = "";
    }

    document.getElementById("possibleWrittenCombinations").innerHTML = "";
    
    let oralFrequencies;
    let oralAndWrittenCombinations;

    // Handle edge case where there are no combinations
    if (courseCombinations.length == 0) {
        // Check if there are any nonpaired written possibilities
        if (possibleWrittenCourses.length > 0) {
            // Need 2 oral exams and 1 written
            const list = document.getElementById("possibleWrittenCombinations");
            list.innerHTML = "";

            for (const course of possibleWrittenCourses) {
                const el = document.createElement("li");
                el.innerText = `${course.title} (${course.code})`;
                list.appendChild(el);
            }

            edgeCaseNoticeOne.style.display = "";

            oralFrequencies = calculateOralFrequenciesForOneEdgeCase(possibleOralCourses, possibleWrittenCourses);
            oralAndWrittenCombinations = findOralAndWrittenCombinationsForOneEdgeCase(possibleOralCourses, possibleWrittenCourses);
        }
        else {
            // Need 3 oral exams
            edgeCaseNoticeNone.style.display = "";

            oralFrequencies = calculateOralFrequenciesForNoneEdgeCase(possibleOralCourses);
            oralAndWrittenCombinations = findOralAndWrittenCombinationsForNoneEdgeCase(possibleOralCourses);

        }
    }
    else {
        renderCombinations(courseCombinations);

        oralFrequencies = calculateOralFrequencies(possibleOralCourses, courseCombinations);
        oralAndWrittenCombinations = findOralAndWrittenCombinations(possibleOralCourses, courseCombinations);
    }

    const relativeFrequencies = {};
    const relativeFrequenciesArray = []

    for (const course of possibleWrittenCourses) {
        let count = 0;
        let freq = 1 / possibleWrittenCourses.length;
        
        // Standard case
        if (courseCombinations.length > 0) {
            for (const comb of courseCombinations) {
                count += comb[0] == course || comb[1] == course;
            }
    
            freq = count / courseCombinations.length;
        }

        relativeFrequencies[course.code] = freq;

        relativeFrequenciesArray.push([freq, `${course.title} (${course.code})`]);
    }

    relativeFrequenciesArray.sort((a, b) => b[0] - a[0]);


    const relativeFrequencyTbody = document.getElementById("relativeFrequencyTbody");
    relativeFrequencyTbody.innerHTML = "";

    for (const rf of relativeFrequenciesArray) {
        const row = document.createElement("tr");
        const titleCell = document.createElement("td");
        titleCell.textContent = rf[1];
        row.appendChild(titleCell);

        const freqCell = document.createElement("td");
        freqCell.textContent = Math.floor(rf[0] * 100) + "%";
        row.appendChild(freqCell);

        relativeFrequencyTbody.appendChild(row);
    }
    
    const probabilitiesPerDay = {};

    clearCalendar();

    for (const course of possibleWrittenCourses) {
        let dayBody = document.querySelector(`.calendar-body[data-calendar-date="${course.examDate}"]`);

        let el = document.createElement("div");
        if (course.preparationDay !== undefined)
            el.innerText = `Eksamen ${course.title} (${course.code}): ${Math.floor(relativeFrequencies[course.code] * 100)}%`
        else
            el.innerText = `${course.title} (${course.code}): ${Math.floor(relativeFrequencies[course.code] * 100)}%`
        
        

        dayBody.appendChild(el);

        if (!(course.examDate in probabilitiesPerDay)) 
            probabilitiesPerDay[course.examDate] = [relativeFrequencies[course.code]];
        else 
            probabilitiesPerDay[course.examDate].push(relativeFrequencies[course.code])

        if (course.preparationDay !== undefined) {
            dayBody = document.querySelector(`.calendar-body[data-calendar-date="${course.preparationDay}"]`);

            el = document.createElement("div");
            el.innerText = `Forberedelsesdag ${course.title} (${course.code}): ${Math.floor(relativeFrequencies[course.code] * 100)}%`
    
            dayBody.appendChild(el);
    
            if (!(course.preparationDay in probabilitiesPerDay))
                probabilitiesPerDay[course.preparationDay] = [relativeFrequencies[course.code]];
            else
                probabilitiesPerDay[course.preparationDay].push(relativeFrequencies[course.code]);

        }
    }

    for (const date in probabilitiesPerDay) {
        if (!probabilitiesPerDay.hasOwnProperty(date)) continue;

        const arr = probabilitiesPerDay[date];
        if (arr.length > 1) {
            let sum = 0;
            for (const el of arr) sum += el;

            // Presumably the sum only exceeds 1 in cases when two events are guaranteed to happen on the same day, making a Math.min safe
            sum = Math.min(sum, 1);

            const dayBody = document.querySelector(`.calendar-body[data-calendar-date="${date}"]`);

            const el = document.createElement("div");
            el.className = "mt-1";
            el.innerText = `Totalt: ${Math.floor(sum * 100)}%`

            dayBody.appendChild(el);
        }
    }

    const oralFrequencyArray = [];

    for (const code in oralFrequencies) {
        if (!oralFrequencies.hasOwnProperty(code)) continue;

        oralFrequencyArray.push([oralFrequencies[code], code]);
    }

    oralFrequencyArray.sort((a, b) => b[0] - a[0]);


    const relativeOralFrequencyTbody = document.getElementById("relativeOralFrequencyTbody");
    relativeOralFrequencyTbody.innerHTML = "";

    for (const rf of oralFrequencyArray) {
        const row = document.createElement("tr");
        const titleCell = document.createElement("td");
        
        const course = findCourseInArray(possibleOralCourses, rf[1]);
        titleCell.textContent = `${course.title} (${course.code})`;
        row.appendChild(titleCell);

        const freqCell = document.createElement("td");
        freqCell.textContent = Math.floor(rf[0] * 100) + "%";
        row.appendChild(freqCell);

        relativeOralFrequencyTbody.appendChild(row);
    }

    document.getElementById("expectanciesTbody").innerHTML = "";

    let expectedNorwegianExams = 1 + oralFrequencies["NOR1269"];
    if (!noSecondChoiceForm) 
        expectedNorwegianExams += relativeFrequencies["NOR1268"];

    addExpectancyRow("Norskeksamener", expectedNorwegianExams);

    let writtenCommonCourses = 0;
    let writtenProgramCourses = 0;

    for (const course of possibleWrittenCourses) {
        if (course.fellesfag && course.code != "NOR1268" && course.code in relativeFrequencies)
            writtenCommonCourses += relativeFrequencies[course.code];
        else if (!course.fellesfag && course.code in relativeFrequencies)
            writtenProgramCourses += relativeFrequencies[course.code];
    }

    addExpectancyRow("Skriftlige eksamener i andre fellesfag", writtenCommonCourses);
    addExpectancyRow("Skriftlige eksamener i programfag", writtenProgramCourses);

    let oralCommonCourses = 0;
    let oralProgramCourses = 0;

    for (const course of possibleOralCourses) {
        if (course.fellesfag && course.code in oralFrequencies)
            oralCommonCourses += oralFrequencies[course.code];
        else if (!course.fellesfag && course.code in oralFrequencies)
            oralProgramCourses += oralFrequencies[course.code];
    }

    addExpectancyRow("Muntlige eksamener i fellesfag (inkludert norsk)", oralCommonCourses);
    addExpectancyRow("Muntlige eksamener i programfag", oralProgramCourses);

    calculateAndRenderTotalExpectanciesAndProbabilities(oralFrequencies, relativeFrequencies, courseCombinations, possibleOralCourses);    

    let gec = new GradeEstimationCalculator(oralFrequencies, relativeFrequencies, possibleWrittenCourses, possibleOralCourses, oralAndWrittenCombinations);
}

function goToCalculator() {
    runCalculator();

    document.getElementById("course-input-wrapper").style.display = "none";
    document.getElementById("calculator-wrapper").style.display = "";
}

function goToInputPage() {
    document.getElementById("course-input-wrapper").style.display = "";
    document.getElementById("calculator-wrapper").style.display = "none";
}

init();
renderCourses();
google.charts.load("current", {packages:["corechart"]});