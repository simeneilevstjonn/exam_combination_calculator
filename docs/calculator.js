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

const writtenExamTypes = [5, 6, 7, 8, 27];
const oralOrOtherwiseExamTypes = [3, 4, 6, 7, 8, 13, 27];
const excludesOralIfWrittenExamTypes = [6, 7];

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
    list.innerHTML = "";

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

    renderCombinations(courseCombinations);

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

    const relativeFrequencies = {};
    const relativeFrequenciesArray = []

    for (const course of possibleWrittenCourses) {
        let count = 0;
        for (const comb of courseCombinations) {
            count += comb[0] == course || comb[1] == course;
        }

        let freq = count / courseCombinations.length;

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

            const dayBody = document.querySelector(`.calendar-body[data-calendar-date="${date}"]`);

            const el = document.createElement("div");
            el.className = "mt-1";
            el.innerText = `Totalt: ${Math.floor(sum * 100)}%`

            dayBody.appendChild(el);
        }
    }

    const oralFrequencies = calculateOralFrequencies(possibleOralCourses, courseCombinations);

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
        if (course.fellesfag && course.code != "NOR1268")
            writtenCommonCourses += relativeFrequencies[course.code];
        else if (!course.fellesfag)
            writtenProgramCourses += relativeFrequencies[course.code];
    }

    addExpectancyRow("Skriftlige eksamener i andre fellesfag", writtenCommonCourses);
    addExpectancyRow("Skriftlige eksamener i programfag", writtenProgramCourses);

    let oralCommonCourses = 0;
    let oralProgramCourses = 0;

    for (const course of possibleOralCourses) {
        if (course.fellesfag)
        oralCommonCourses += oralFrequencies[course.code];
        else if (!course.fellesfag)
        oralProgramCourses += oralFrequencies[course.code];
    }

    addExpectancyRow("Muntlige eksamener i fellesfag (inkludert norsk)", oralCommonCourses);
    addExpectancyRow("Muntlige eksamener i programfag", oralProgramCourses);
    
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