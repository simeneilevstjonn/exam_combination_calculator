let courses;

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

init();