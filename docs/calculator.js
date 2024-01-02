let courses;
let activeCourses = [];
let activeCodes = [];

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

    for (const course of activeCourses) {
        const card = document.createElement("div");
        card.className = "card m-2 p-2";

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

    activeCodes.push(code);
    activeCourses.push(courses[code])

    document.getElementById("courseInputDatalist").removeChild(
        document.querySelector(`option[value="${code}"]`)
    );

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

init();