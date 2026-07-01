/**
 * CUISINE & VOUS — Core Application Logic
 * Implements SPA Router, Leaflet.js Interactive Map, Dynamic Calendars, Form Handler, and Admin Panel
 */

// ==========================================================================
// 1. SPA ROUTER (NAVIGATION)
// ==========================================================================
const views = ['home', 'histoire', 'kiosques', 'cuisine', 'engagements', 'menus', 'b2b'];

window.navigateTo = function(viewName) {
    const pageMapping = {
        'home': 'index.html',
        'histoire': 'histoire.html',
        'kiosques': 'kiosque.html',
        'cuisine': 'cuisine.html',
        'engagements': 'engagements.html',
        'menus': 'menus.html',
        'b2b': 'b2b.html'
    };
    if (pageMapping[viewName]) {
        window.location.href = pageMapping[viewName];
    }
};

// Initial load check
window.addEventListener('load', () => {
    // Init interactive map
    initMap();
    
    // Init dynamic dates
    updateDynamicDates();
});

// Mobile navbar toggle click
document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // B2B Appointment Form Submission
    const appForm = document.getElementById('appointmentForm');
    const successFeedback = document.getElementById('formSuccessMessage');
    if (appForm && successFeedback) {
        appForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('form-name').value;
            const org = document.getElementById('form-org').value;
            
            successFeedback.innerHTML = `📅 Merci <strong>${name}</strong> ! Votre demande de rendez-vous pour <strong>${org}</strong> a été enregistrée avec succès. Notre équipe vous recontactera très rapidement.`;
            successFeedback.className = 'form-feedback success';
            successFeedback.style.display = 'block';
            
            appForm.reset();
            
            // Clear message after 8 seconds
            setTimeout(() => {
                successFeedback.style.display = 'none';
            }, 8000);
        });
    }

    // Admin Panel slide-out panel toggle
    const adminToggle = document.getElementById('adminToggle');
    const adminPanel = document.getElementById('adminPanel');
    const adminClose = document.getElementById('adminClose');

    if (adminToggle && adminPanel && adminClose) {
        adminToggle.addEventListener('click', () => {
            adminPanel.classList.toggle('active');
        });

        adminClose.addEventListener('click', () => {
            adminPanel.classList.remove('active');
        });
    }

    // Admin checklist interactions
    setupAdminInteractions();

    // Scroll animation trigger setup
    initScrollReveal();
});

// ==========================================================================
// 2. INTERACTIVE MAP (LEAFLET.JS)
// ==========================================================================
let map;
let markerGroup;

// Coordinates for 19 corporate locations on Rennes area
const kioskLocations = [
    { name: "Alma Business Park (Rennes)", coords: [48.0874, -1.6732] },
    { name: "Atalante Champeaux (Rennes)", coords: [48.1165, -1.7145] },
    { name: "Atalante Via Silva (Cesson-Sévigné)", coords: [48.1219, -1.6234] },
    { name: "Campus de Ker Lann (Bruz)", coords: [48.0531, -1.7423] },
    { name: "Technopôle Mermoz (St-Jacques)", coords: [48.0864, -1.7012] },
    { name: "Zone Rive Ouest (Pacé)", coords: [48.1487, -1.7761] },
    { name: "Centre Commercial Cap Malo (La Mézière)", coords: [48.2185, -1.6942] },
    { name: "Espace Performance (Saint-Grégoire)", coords: [48.1523, -1.6854] },
    { name: "Zone des Loges (Chantepie)", coords: [48.0878, -1.6121] },
    { name: "Parc d'activités de la Hallerais (Vern)", coords: [48.0465, -1.6033] },
    { name: "Pôle d'activités Conterie (Chartres-de-Br.)", coords: [48.0412, -1.7045] },
    { name: "Zone de la Rigourdière (Cesson-Sévigné)", coords: [48.1162, -1.5991] },
    { name: "Zone des Champs Blancs (Rennes)", coords: [48.1298, -1.6254] },
    { name: "Quartier d'affaires EuroRennes", coords: [48.1034, -1.6723] },
    { name: "Ecopôle Sud-Est (Rennes)", coords: [48.0978, -1.6312] },
    { name: "Campus Villejean (Rennes 2)", coords: [48.1194, -1.6985] },
    { name: "Technopole Plaine de Baud (Rennes)", coords: [48.1121, -1.6489] },
    { name: "Zone du Bois de Soeuvres (Vern-sur-Seiche)", coords: [48.0588, -1.6201] },
    { name: "Zone Industrielle Route de Lorient (Rennes)", coords: [48.1095, -1.7245] }
];

function initMap() {
    if (!document.getElementById('map')) return;
    if (map) return; // Prevent double initialization

    // Centered on Rennes, zoom level 11
    map = L.map('map', {
        scrollWheelZoom: false
    }).setView([48.1114, -1.6801], 11);

    // Modern clean grey/wood styled map tiles (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    markerGroup = L.layerGroup().addTo(map);

    renderMarkers(kioskLocations);
}

function renderMarkers(locations) {
    if (!markerGroup) return;
    markerGroup.clearLayers();

    // Custom Diamond shape orange markers via DivIcon
    const customIcon = L.divIcon({
        className: 'custom-diamond-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    locations.forEach(loc => {
        const popupContent = `
            <div class="map-popup">
                <strong style="color: var(--color-text-dark); font-family: var(--font-slab);">${loc.name}</strong>
                <p style="margin: 4px 0 0; font-size: 0.8rem; color: var(--color-text-muted);">Kiosque repas Cuisine & Vous 🥪☕</p>
                <a href="https://www.cuisineetvous-commandes.com/" target="_blank" class="map-popup-link">Commander ici →</a>
            </div>
        `;

        L.marker(loc.coords, { icon: customIcon })
            .bindPopup(popupContent)
            .addTo(markerGroup);
    });
}

// ==========================================================================
// 3. DYNAMIC DATES & ANIMATIONS UPDATES
// ==========================================================================
function updateDynamicDates() {
    // Current date logic
    const today = new Date();
    
    // Get Monday of current week
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMonday));
    
    // Get Friday of current week
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const mondayStr = monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const fridayStr = friday.toLocaleDateString('fr-FR', options);

    // Set Week Date Label
    const weekLabel = document.getElementById('currentWeekDate');
    if (weekLabel) {
        weekLabel.textContent = `Semaine du ${mondayStr} au ${fridayStr}`;
    }

    // Set dynamic months names for Animations
    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const currentMonthIndex = new Date().getMonth();
    const nextMonthIndex1 = (currentMonthIndex + 1) % 12;
    const nextMonthIndex2 = (currentMonthIndex + 2) % 12;

    const currentYear = new Date().getFullYear();
    const yearMonth1 = currentMonthIndex + 1 > 11 ? currentYear + 1 : currentYear;
    const yearMonth2 = currentMonthIndex + 2 > 11 ? currentYear + 1 : currentYear;

    const curMonthEl = document.getElementById('currentMonthName');
    const nextMonth1El = document.getElementById('nextMonthName1');
    const nextMonth2El = document.getElementById('nextMonthName2');

    if (curMonthEl) curMonthEl.textContent = `${monthNames[currentMonthIndex]} ${currentYear}`;
    if (nextMonth1El) nextMonth1El.textContent = `${monthNames[nextMonthIndex1]} ${yearMonth1}`;
    if (nextMonth2El) nextMonth2El.textContent = `${monthNames[nextMonthIndex2]} ${yearMonth2}`;
}

// ==========================================================================
// 4. ALTERNANTE PANEL INTERACTIONS
// ==========================================================================
function setupAdminInteractions() {
    const taskPdf = document.getElementById('task-pdf');
    const taskGps = document.getElementById('task-gps');
    const taskPhotos = document.getElementById('task-photos');
    const taskAnims = document.getElementById('task-anims');

    // 1. Weekly PDF updates simulation
    if (taskPdf) {
        taskPdf.addEventListener('change', (e) => {
            const previewArea = document.getElementById('pdfPreviewArea');
            if (e.target.checked) {
                previewArea.innerHTML = `
                    <div style="text-align: center; color: var(--color-dark); max-width: 500px;">
                        <i class="fa-solid fa-circle-check" style="font-size: 4rem; color: #2E7D32; margin-bottom: 20px;"></i>
                        <h4 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px;">Nouveau menu PDF validé !</h4>
                        <p style="font-size: 0.95rem; color: var(--color-text-muted);">L'alternante a correctement mis à jour le fichier <strong>Menu_Semaine_Active.pdf</strong>.</p>
                        <span style="font-size: 0.8rem; background-color: #C8E6C9; color: #2E7D32; padding: 4px 12px; border-radius: 4px; display: inline-block; margin-top: 12px; font-weight: 600;">EN LIGNE</span>
                    </div>
                `;
                document.getElementById('currentWeekDate').textContent = "📅 Semaine du Lundi Prochain (Mis à jour !)";
            } else {
                previewArea.innerHTML = `
                    <div class="pdf-placeholder-screen">
                        <i class="fa-regular fa-file-pdf"></i>
                        <p>Aperçu du menu de la semaine</p>
                        <span class="pdf-detail-txt">Mis à jour chaque lundi matin par l'alternante.</span>
                    </div>
                `;
                updateDynamicDates();
            }
        });
    }

    // 2. Real GPS points simulation
    if (taskGps) {
        taskGps.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Shift coordinates slightly or change popup titles to indicate REAL coordinates
                const realKiosks = kioskLocations.map(loc => ({
                    name: `📍 VRAI KIOSQUE - ${loc.name.replace(' (Rennes)', '')}`,
                    coords: loc.coords
                }));
                renderMarkers(realKiosks);
                alert("GPS : Vrais points physiques de nos 19 structures bois chargés avec succès !");
            } else {
                renderMarkers(kioskLocations);
            }
        });
    }

    // 3. Kiosk visual photo replacement
    if (taskPhotos) {
        taskPhotos.addEventListener('change', (e) => {
            const visualContainer = document.querySelector('.concept-visual');
            if (visualContainer) {
                if (e.target.checked) {
                    visualContainer.innerHTML = `
                        <img src="assets/cuisine_kiosk.png" alt="Photo réelle du kiosque" style="width: 100%; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); border: 4px solid var(--color-wood);">
                        <p class="font-handwritten text-center" style="margin-top: 8px; font-size: 1.5rem; color: var(--color-wood);">Notre structure 100% bois naturel ! 🌲</p>
                    `;
                } else {
                    visualContainer.innerHTML = `
                        <div class="wood-placeholder">
                            <i class="fa-solid fa-shop"></i>
                            <span>Photo Kiosque Bois</span>
                        </div>
                    `;
                }
            }
        });
    }

    // 4. Monthly animations grid shifter
    if (taskAnims) {
        taskAnims.addEventListener('change', (e) => {
            const curMonthEl = document.getElementById('currentMonthName');
            const activeCardBody = document.querySelector('.anim-card.active-month .anim-body');
            
            if (e.target.checked && activeCardBody) {
                curMonthEl.textContent = "Juillet 2026";
                activeCardBody.innerHTML = `
                    <h4>⚓ Escale en Bretagne (Actif !)</h4>
                    <p>Le poisson de pays et les caramels au beurre salé débarquent au bureau ! Menu spécial galette sarrasin le mardi.</p>
                `;
            } else {
                updateDynamicDates();
                if (activeCardBody) {
                    activeCardBody.innerHTML = `
                        <h4>☀️ Saveurs d'été & Smoothies</h4>
                        <p>Animation Smoothies frais préparés à la minute par votre JAG et salades composées aux herbes fraîches du jardin.</p>
                    `;
                }
            }
        });
    }
}

// ==========================================================================
// 5. SCROLL REVEAL (INTERSECTION OBSERVER)
// ==========================================================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Trigger once
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

// ==========================================================================
// 6. TIMELINE HORIZONTALE — DRAG TO SCROLL
// ==========================================================================
function initTimelineDrag() {
    const outer = document.getElementById('timelineOuter');
    if (!outer) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    outer.addEventListener('mousedown', (e) => {
        isDown = true;
        outer.classList.add('dragging');
        startX = e.pageX - outer.offsetLeft;
        scrollLeft = outer.scrollLeft;
    });

    outer.addEventListener('mouseleave', () => {
        isDown = false;
        outer.classList.remove('dragging');
    });

    outer.addEventListener('mouseup', () => {
        isDown = false;
        outer.classList.remove('dragging');
    });

    outer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - outer.offsetLeft;
        const walk = (x - startX) * 1.5;
        outer.scrollLeft = scrollLeft - walk;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTimelineDrag();
});

// ==========================================================================
// 7. VIDEO PLACEHOLDER HANDLER
// ==========================================================================
window.handleVideoPlay = function() {
    const placeholder = document.getElementById('homeVideoPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = `
            <iframe width="100%" height="100%" 
                src="https://www.youtube.com/embed/LDt8I5DKqcA?autoplay=1" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen 
                style="border-radius: 12px; border: none; width: 100%; height: 100%; position: absolute; top: 0; left: 0;">
            </iframe>
        `;
    }
};
