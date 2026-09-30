"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* ================= ÉTAT ================= */

const state = {
    orientation: "portrait"
};


/* ================= FORMATS ================= */

const paperSizes = {

    A3: {
        width: 297,
        height: 420
    },

    A4: {
        width: 210,
        height: 297
    },

    A5: {
        width: 148,
        height: 210
    },

    LETTER: {
        width: 216,
        height: 279
    },

    LEGAL: {
        width: 216,
        height: 356
    }

};


/* ================= OUTILS ================= */

function getNumber(id, fallback = 0) {

    const value = Number($(id)?.value);

    return Number.isFinite(value)
        ? value
        : fallback;
}


function getValue(id, fallback = "") {

    const value = $(id)?.value;

    return value !== undefined
        ? value
        : fallback;
}


function clamp(value, min, max) {

    return Math.min(
        Math.max(value, min),
        max
    );

}


/* ================= FORMAT ================= */

function getPaperDimensions() {

    const selected = getValue("#paperSize", "A4");

    const original = paperSizes[selected];

    let width = original.width;
    let height = original.height;

    if (state.orientation === "landscape") {

        [width, height] = [height, width];

    }

    return {
        width,
        height
    };

}


/* ================= GRILLE ================= */

function calculateGrid() {

    const paper = getPaperDimensions();

    let rows = clamp(
        getNumber("#rows", 2),
        1,
        10
    );

    let columns = clamp(
        getNumber("#columns", 2),
        1,
        10
    );

    let gapX = Math.max(
        0,
        getNumber("#gapX", 5)
    );

    let gapY = Math.max(
        0,
        getNumber("#gapY", 5)
    );

    let marginX = Math.max(
        0,
        getNumber("#marginX", 10)
    );

    let marginY = Math.max(
        0,
        getNumber("#marginY", 10)
    );


    const availableWidth =
        paper.width -
        marginX * 2 -
        gapX * (columns - 1);


    const availableHeight =
        paper.height -
        marginY * 2 -
        gapY * (rows - 1);


    let zoneWidth =
        availableWidth / columns;


    let zoneHeight =
        availableHeight / rows;


    /*
     * Si les zones carrées sont activées,
     * on utilise la même dimension pour largeur
     * et hauteur.
     */

    if ($("#squareZones")?.checked) {

        const squareSize =
            Math.min(
                zoneWidth,
                zoneHeight
            );

        zoneWidth = squareSize;
        zoneHeight = squareSize;

    }


    /*
     * Centrage de la grille
     */

    let totalWidth =
        zoneWidth * columns +
        gapX * (columns - 1);


    let totalHeight =
        zoneHeight * rows +
        gapY * (rows - 1);


    let startX = marginX;
    let startY = marginY;


    if ($("#centerGrid")?.checked) {

        startX =
            (paper.width - totalWidth) / 2;

        startY =
            (paper.height - totalHeight) / 2;

    }


    return {

        paper,

        rows,
        columns,

        gapX,
        gapY,

        marginX,
        marginY,

        zoneWidth,
        zoneHeight,

        startX,
        startY,

        totalWidth,
        totalHeight

    };

}


/* ================= NUMÉROTATION ================= */

function getNumberForPosition(
    sheet,
    row,
    column,
    rows,
    columns
) {

    const mode =
        getValue(
            "#numberMode",
            "sequential"
        );

    const totalPerSheet =
        rows * columns;


    const position =
        row * columns + column;


    let index;


    if (mode === "sequential") {

        /*
         * Exemple :
         *
         * Feuille 1
         * 001 002
         * 003 004
         *
         * Feuille 2
         * 005 006
         * 007 008
         */

        index =
            sheet * totalPerSheet +
            position +
            1;

    } else {

        /*
         * Exemple avec 4 feuilles
         * et 4 positions :
         *
         * feuille 1 : 001 005 009...
         * feuille 2 : 002 006 010...
         */

        index =
            position *
                getNumber(
                    "#sheetCount",
                    1
                ) +
            sheet +
            1;

    }


    const digits =
        clamp(
            getNumber("#digits", 3),
            1,
            8
        );


    const prefix =
        getValue(
            "#prefix",
            "REC-"
        );


    return (
        prefix +
        String(index).padStart(
            digits,
            "0"
        )
    );

}


/* ================= APERÇU ================= */

function renderPreview() {

    const preview =
        $("#paperPreview");

    if (!preview) {
        return;
    }


    const grid =
        calculateGrid();


    preview.innerHTML = "";


    /*
     * Ratio réel du papier
     */

    preview.style.aspectRatio =
        `${grid.paper.width} / ${grid.paper.height}`;


    /*
     * Nombre de zones
     */

    const total =
        grid.rows *
        grid.columns;


    /*
     * Première feuille affichée
     */

    for (
        let row = 0;
        row < grid.rows;
        row++
    ) {

        for (
            let column = 0;
            column < grid.columns;
            column++
        ) {

            const zone =
                document.createElement(
                    "div"
                );

            zone.className =
                "zone";


            const left =
                (
                    grid.startX +
                    column *
                        (
                            grid.zoneWidth +
                            grid.gapX
                        )
                ) /
                grid.paper.width *
                100;


            const top =
                (
                    grid.startY +
                    row *
                        (
                            grid.zoneHeight +
                            grid.gapY
                        )
                ) /
                grid.paper.height *
                100;


            const width =
                grid.zoneWidth /
                grid.paper.width *
                100;


            const height =
                grid.zoneHeight /
                grid.paper.height *
                100;


            zone.style.left =
                `${left}%`;

            zone.style.top =
                `${top}%`;

            zone.style.width =
                `${width}%`;

            zone.style.height =
                `${height}%`;


            const number =
                document.createElement(
                    "span"
                );

            number.className =
                "zone-number";


            number.textContent =
                getNumberForPosition(
                    0,
                    row,
                    column,
                    grid.rows,
                    grid.columns
                );


            zone.appendChild(number);

            preview.appendChild(zone);

        }

    }


    $("#previewInfo").textContent =
        `${getValue("#paperSize", "A4")} · ` +
        `${state.orientation === "portrait"
            ? "Portrait"
            : "Paysage"} · ` +
        `${total} zones`;

}


/* ================= ORIENTATION ================= */

$$(".segment").forEach(button => {

    button.addEventListener(
        "click",
        () => {

            $$(".segment").forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );


            button.classList.add(
                "active"
            );


            state.orientation =
                button.dataset.orientation;


            renderPreview();

        }
    );

});


/* ================= INPUTS ================= */

$$(
    "#paperSize, #rows, #columns, #gapX, #gapY, #marginX, #marginY, #squareZones, #centerGrid, #numberMode, #prefix, #digits, #sheetCount"
).forEach(element => {

    element.addEventListener(
        "input",
        renderPreview
    );

    element.addEventListener(
        "change",
        renderPreview
    );

});


/* ================= FICHIER ================= */

$("#documentInput")?.addEventListener(
    "change",
    event => {

        const file =
            event.target.files[0];

        if (!file) {

            $("#fileName").textContent =
                "PDF, DOC ou DOCX";

            return;

        }


        $("#fileName").textContent =
            file.name;

    }
);


/* ================= PDF ================= */

function generatePDF() {

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        alert(
            "La bibliothèque PDF n'est pas disponible."
        );

        return;

    }


    const {
        jsPDF
    } = window.jspdf;


    const format =
        getValue(
            "#paperSize",
            "A4"
        ).toLowerCase();


    const orientation =
        state.orientation;


    const pdf =
        new jsPDF({
            orientation,
            unit: "mm",
            format
        });


    const sheetCount =
        clamp(
            getNumber(
                "#sheetCount",
                4
            ),
            1,
            1000
        );


    const grid =
        calculateGrid();


    for (
        let sheet = 0;
        sheet < sheetCount;
        sheet++
    ) {

        if (sheet > 0) {

            pdf.addPage(
                format,
                orientation
            );

        }


        for (
            let row = 0;
            row < grid.rows;
            row++
        ) {

            for (
                let column = 0;
                column < grid.columns;
                column++
            ) {

                const x =
                    grid.startX +
                    column *
                        (
                            grid.zoneWidth +
                            grid.gapX
                        );


                const y =
                    grid.startY +
                    row *
                        (
                            grid.zoneHeight +
                            grid.gapY
                        );


                /*
                 * Bordure de la zone.
                 */

                pdf.setDrawColor(
                    150,
                    165,
                    185
                );


                pdf.setLineDashPattern(
                    [2, 2],
                    0
                );


                pdf.rect(
                    x,
                    y,
                    grid.zoneWidth,
                    grid.zoneHeight
                );


                /*
                 * Numéro
                 */

                const number =
                    getNumberForPosition(
                        sheet,
                        row,
                        column,
                        grid.rows,
                        grid.columns
                    );


                pdf.setLineDashPattern(
                    [],
                    0
                );


                pdf.setFontSize(9);

                pdf.setTextColor(
                    23,
                    105,
                    255
                );


                pdf.text(
                    number,
                    x +
                        grid.zoneWidth -
                        4,
                    y +
                        grid.zoneHeight -
                        4,
                    {
                        align: "right"
                    }
                );

            }

        }

    }


    pdf.save(
        "NumeroPrint-Pro-production.pdf"
    );

}


/* ================= PRINT ================= */

function printPreview() {

    window.print();

}


/* ================= RESET ================= */

function resetApp() {

    $("#paperSize").value = "A4";

    $("#rows").value = 2;

    $("#columns").value = 2;

    $("#gapX").value = 5;

    $("#gapY").value = 5;

    $("#marginX").value = 10;

    $("#marginY").value = 10;

    $("#squareZones").checked = true;

    $("#centerGrid").checked = true;

    $("#numberMode").value =
        "sequential";

    $("#prefix").value =
        "REC-";

    $("#digits").value = 3;

    $("#sheetCount").value = 4;

    $("#documentInput").value = "";

    $("#fileName").textContent =
        "PDF, DOC ou DOCX";


    state.orientation =
        "portrait";


    $$(".segment").forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.orientation ===
                    "portrait"
            );

        }
    );


    renderPreview();

}


/* ================= BOUTONS ================= */

$("#generatePdf")?.addEventListener(
    "click",
    generatePDF
);


$("#printPreview")?.addEventListener(
    "click",
    printPreview
);


$("#resetApp")?.addEventListener(
    "click",
    resetApp
);


/* ================= DOWNLOAD ================= */

$("#downloadButton")?.addEventListener(
    "click",
    () => {

        const status =
            $("#downloadStatus");

        if (!status) {
            return;
        }

        status.textContent =
            "Téléchargement du setup Windows…";

        setTimeout(() => {

            status.textContent =
                "Le téléchargement devrait démarrer automatiquement.";

        }, 1000);

    }
);


/* ================= ANNÉE ================= */

$("#year").textContent =
    new Date().getFullYear();


/* ================= INITIALISATION ================= */

renderPreview();
/* =========================================================
   UX PRO — navigation, scroll reveal, galerie développeur
   ========================================================= */

(() => {
    const header = document.querySelector(".header");
    const progress = document.querySelector("#scrollProgress");
    const nav = document.querySelector("#mainNav");
    const navToggle = document.querySelector("#navToggle");

    function updateScrollUI() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = total > 0 ? scrollTop / total : 0;

        if (progress) progress.style.width = `${Math.min(ratio * 100, 100)}%`;
        if (header) header.classList.toggle("scrolled", scrollTop > 12);
    }

    window.addEventListener("scroll", updateScrollUI, { passive: true });
    updateScrollUI();

    if (navToggle && nav) {
        const closeNav = () => {
            nav.classList.remove("open");
            navToggle.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
            navToggle.setAttribute("aria-label", "Ouvrir le menu");
        };

        navToggle.addEventListener("click", () => {
            const open = nav.classList.toggle("open");
            navToggle.classList.toggle("open", open);
            navToggle.setAttribute("aria-expanded", String(open));
            navToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
        });

        nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeNav));
        document.addEventListener("click", event => {
            if (window.innerWidth <= 950 && nav.classList.contains("open") &&
                !nav.contains(event.target) && !navToggle.contains(event.target)) {
                closeNav();
            }
        });
    }

    // Apparition progressive des blocs lors du défilement.
    const reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        reveals.forEach(el => observer.observe(el));
    } else {
        reveals.forEach(el => el.classList.add("is-visible"));
    }

    // Navigation active selon la section visible.
    const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
    const sections = navLinks
        .map(link => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navLinks.forEach(link => link.classList.toggle(
                    "active",
                    link.getAttribute("href") === `#${entry.target.id}`
                ));
            });
        }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });
        sections.forEach(section => sectionObserver.observe(section));
    }

    // Galerie automatique du développeur.
    const gallery = document.querySelector("#creatorGallery");
    if (!gallery) return;

    const track = gallery.querySelector("#galleryTrack");
    const slides = [...gallery.querySelectorAll(".gallery-slide")];
    const dots = [...gallery.querySelectorAll(".gallery-dot")];
    const previous = gallery.querySelector(".gallery-prev");
    const next = gallery.querySelector(".gallery-next");

    let current = 0;
    let timer = null;
    let touchStartX = 0;
    let touchEndX = 0;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function showSlide(index, userAction = false) {
        current = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;

        slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === current);
            dot.setAttribute("aria-current", i === current ? "true" : "false");
        });

        if (userAction) restart();
    }

    function stop() {
        if (timer) clearInterval(timer);
        timer = null;
    }

    function start() {
        if (reducedMotion || document.hidden || slides.length < 2) return;
        stop();
        timer = setInterval(() => showSlide(current + 1), 4800);
    }

    function restart() {
        stop();
        start();
    }

    previous?.addEventListener("click", () => showSlide(current - 1, true));
    next?.addEventListener("click", () => showSlide(current + 1, true));
    dots.forEach((dot, index) => dot.addEventListener("click", () => showSlide(index, true)));

    gallery.addEventListener("mouseenter", stop);
    gallery.addEventListener("mouseleave", start);
    gallery.addEventListener("focusin", stop);
    gallery.addEventListener("focusout", event => {
        if (!gallery.contains(event.relatedTarget)) start();
    });

    gallery.addEventListener("touchstart", event => {
        touchStartX = event.changedTouches[0].screenX;
        stop();
    }, { passive: true });

    gallery.addEventListener("touchend", event => {
        touchEndX = event.changedTouches[0].screenX;
        const distance = touchEndX - touchStartX;
        if (Math.abs(distance) > 45) showSlide(current + (distance < 0 ? 1 : -1));
        start();
    }, { passive: true });

    document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
    showSlide(0);
    start();
})();
