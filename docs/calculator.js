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
        card.appendChild(dateInfo);

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

            card.appendChild(overlapsList);
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
    console.log(combinations)

    for (const comb of combinations) {
        const ca = comb[0];
        const cb = comb[1];
        const el = document.createElement("li");
        el.innerText = `${ca.title} (${ca.code}), ${cb.title} (${cb.code})`;
        list.appendChild(el);
    }
}

function runCalculator() {
    // Find all possible combinations between two courses for a written exam
    let courseCombinations = [];

    let possibleCourses = activeCourses;
    if (!noSecondChoiceForm) possibleCourses = [secondChoiceFormCourse].concat(activeCourses);

    console.log(possibleCourses)

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