let map = L.map('map', {
    zoomControl: false,
    attributionControl: false
});
let markers = [];
let userLat = null;
let userLon = null;
let userMarker = null;

/* ---------- Random event images ---------- */
function getRandomEventImage() {
    const images = [
        'https://adamconcerts.com/wp-content/uploads/2025/10/Theodora_2026_web_META_1080x1440_SoldOut_Marseille.jpg',
        'https://files.offi.fr/programmation/3020022/images/1000/e31acdb8ecb31d76416f990de9f59a01.png',
        'https://www.parisladefense-arena.com/uploads/2025/05/visu-date-2-819x1024.jpg'
    ];
    return images[Math.floor(Math.random() * images.length)];
}

/* ---------- Icônes dynamiques ---------- */
function getMarkerSize(zoom) {
    // Taille de base au zoom 12
    const baseSize = 11;
    const baseZoom = 12;
    // Calcul de la taille en fonction du zoom (min 6px, max 25px)
    const size = Math.max(6, Math.min(25, baseSize * Math.pow(1.2, zoom - baseZoom)));
    return size;
}

function createConcertIcon(zoom) {
    const size = getMarkerSize(zoom);
    return L.divIcon({
        className: 'concert-marker',
        html: '<div class="marker-dot"></div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

function createUserIcon(zoom) {
    const size = getMarkerSize(zoom) + 5;
    return L.divIcon({
        className: 'user-marker',
        html: '<div class="marker-dot user-dot"></div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
}

/* ---------- Icônes SVG pour les grandes salles ---------- */
function createVenueIcon(svgFileName, zoom) {
    // Taille de base 50px au zoom 12, adaptée au zoom actuel
    const baseSize = 100;
    const baseZoom = 12;
    const size = Math.max(30, Math.min(80, baseSize * Math.pow(1.7, zoom - baseZoom)));
    
    return L.icon({
        iconUrl: `images/${svgFileName}`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
        className: 'venue-marker'
    });
}

/* ---------- Grandes salles de Paris avec événements ---------- */
const parisVenues = [
    {
        name: "Accor Arena (Bercy)",
        svg: "Bercy.svg",
        coordinates: { lat: 48.8393, lon: 2.3791 },
        event: {
            title_fr: "Concert à l'Accor Arena",
            location_name: "Accor Arena",
            location_address: "8 Boulevard de Bercy",
            location_city: "Paris",
            location_postalcode: "75012",
            daterange_fr: "15/03/2026"
        }
    },
    {
        name: "Olympia",
        svg: "Olympia.svg",
        coordinates: { lat: 48.8698, lon: 2.3266 },
        event: {
            title_fr: "Concert à l'Olympia",
            location_name: "L'Olympia",
            location_address: "28 Boulevard des Capucines",
            location_city: "Paris",
            location_postalcode: "75009",
            daterange_fr: "22/03/2026"
        }
    },
    {
        name: "Stade de France",
        svg: "SDF.svg",
        coordinates: { lat: 48.9244, lon: 2.3601 },
        event: {
            title_fr: "Concert au Stade de France",
            location_name: "Stade de France",
            location_address: "93200 Saint-Denis",
            location_city: "Saint-Denis",
            location_postalcode: "93200",
            daterange_fr: "10/06/2026"
        }
    },
    {
        name: "Paris La Défense Arena",
        svg: "defense arena.svg",
        coordinates: { lat: 48.8956, lon: 2.2283 },
        event: {
            title_fr: "Concert à la Paris La Défense Arena",
            location_name: "Paris La Défense Arena",
            location_address: "99 Jardin de l'Arche",
            location_city: "Nanterre",
            location_postalcode: "92000",
            daterange_fr: "18/04/2026"
        }
    },
    {
        name: "Zénith Paris",
        svg: "Zenith.svg",
        coordinates: { lat: 48.8937, lon: 2.3933 },
        event: {
            title_fr: "Concert au Zénith de Paris",
            location_name: "Zénith Paris - La Villette",
            location_address: "211 Avenue Jean Jaurès",
            location_city: "Paris",
            location_postalcode: "75019",
            daterange_fr: "05/05/2026"
        }
    }
];

/* ---------- Ajouter les marqueurs des grandes salles ---------- */
function addVenueMarkers() {
    const currentZoom = map.getZoom();
    parisVenues.forEach(venue => {
        const icon = createVenueIcon(venue.svg, currentZoom);
        const marker = L.marker([venue.coordinates.lat, venue.coordinates.lon], { 
            icon: icon
        })
            .addTo(map)
            .on('click', () => openEventDrawer(venue.event));
        
        marker.isVenue = true; // Marquer comme grande salle
        marker.venueSvg = venue.svg; // Stocker le nom du fichier SVG
        markers.push(marker);
    });
}

/* ---------- Carte ---------- */
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

/* ---------- Gestion du zoom ---------- */
map.on('zoomend', function() {
    const currentZoom = map.getZoom();
    const newIcon = createConcertIcon(currentZoom);
    
    // Mise à jour de tous les marqueurs
    markers.forEach(marker => {
        if (marker.isVenue && marker.venueSvg) {
            // Mettre à jour les marqueurs SVG des grandes salles
            marker.setIcon(createVenueIcon(marker.venueSvg, currentZoom));
        } else if (!marker.isVenue) {
            // Mettre à jour les marqueurs de concert réguliers
            marker.setIcon(newIcon);
        }
    });
    
    // Mise à jour du marqueur utilisateur
    if (userMarker) {
        userMarker.setIcon(createUserIcon(currentZoom));
    }
});


/* ---------- Nettoyage des marqueurs ---------- */
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

/* ---------- Création des marqueurs depuis l'API ---------- */
function createEventMarkers(events) {
    clearMarkers();

    const currentZoom = map.getZoom();
    const icon = createConcertIcon(currentZoom);

    events.forEach(event => {
        if (!event.location_coordinates) return;

        const { lat, lon } = event.location_coordinates;

        const marker = L.marker([lat, lon], { icon: icon })
            .addTo(map)
            .on('click', () => openEventDrawer(event));

        markers.push(marker);
    });
}

/* ---------- Gestion de la navbar avec les tiroirs ---------- */
function hideBottomNav() {
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        bottomNav.classList.add('hidden');
    }
}

function showBottomNav() {
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        bottomNav.classList.remove('hidden');
    }
}

/* ---------- Ouvrir le tiroir d'événement ---------- */
function openEventDrawer(event) {
    const drawer = document.getElementById('event-drawer');
    const drawerContent = document.getElementById('drawer-content');
    
    // Formater la date
    const dateText = event.daterange_fr || 'Date à confirmer';
    
    // Get random image
    const randomImage = getRandomEventImage();
    
    drawerContent.innerHTML = `
        <div class="drawer-header">
            <div class="drawer-tag">Prochain Concert</div>
            <button class="drawer-close" onclick="closeEventDrawer()">×</button>
        </div>
        <div class="event-content">
            <div class="drawer-image" style="background-image: url('${randomImage}'); background-size: cover; background-position: center;">
            </div>
            <div class="event-info">
                <h2 class="drawer-title">${event.title_fr || 'Sans titre'}</h2>
                <p class="drawer-date">${dateText}</p>
                <p class="drawer-location">${event.location_name || ''}</p>
                <p class="drawer-address">${event.location_address || ''}</p>
                ${event.location_city ? `<p class="drawer-city">${event.location_postalcode || ''} ${event.location_city}</p>` : ''}
            </div>
        </div>
        <button class="drawer-save-btn" onclick="goToEventDetail(${JSON.stringify(event).replace(/"/g, '&quot;')})">En savoir plus</button>
    `;
    
    drawer.classList.add('open');
    hideBottomNav();
}

/* ---------- Redirection vers la page de détail ---------- */
function goToEventDetail(event) {
    const eventData = encodeURIComponent(JSON.stringify(event));
    window.location.href = `event-detail.html?event=${eventData}`;
}

/* ---------- Fermer le tiroir ---------- */
function closeEventDrawer() {
    const drawer = document.getElementById('event-drawer');
    drawer.classList.remove('open');
    showBottomNav();
}

/* ---------- Ouvrir/Fermer le tiroir de filtres ---------- */
function toggleFilterDrawer() {
    const drawer = document.getElementById('filter-drawer');
    drawer.classList.toggle('open');
    
    if (drawer.classList.contains('open')) {
        hideBottomNav();
    } else {
        showBottomNav();
    }
}

function closeFilterDrawer() {
    const drawer = document.getElementById('filter-drawer');
    drawer.classList.remove('open');
    showBottomNav();
}

/* ---------- Gestion des filtres ---------- */
let activeFilters = {
    genres: [],
    types: [],
    dates: [],
    distances: []
};

document.addEventListener('DOMContentLoaded', function() {
    // Check if coming from onboarding
    const fromOnboarding = localStorage.getItem('fromOnboarding');
    if (fromOnboarding === 'true') {
        // Show welcome panel only when coming from onboarding
        const welcomeOverlay = document.getElementById('welcome-overlay');
        if (welcomeOverlay) {
            welcomeOverlay.classList.add('show');
        }
        // Remove the flag immediately
        localStorage.removeItem('fromOnboarding');
    }

    // Toggle filter options
    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // Apply filters button
    const applyBtn = document.querySelector('.apply-filters-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            // Get selected filters
            const activeFilterElements = document.querySelectorAll('.filter-option.active');
            
            // Reset filters
            activeFilters = {
                genres: [],
                types: [],
                dates: [],
                distances: []
            };
            
            // Collect active filters
            activeFilterElements.forEach(filter => {
                const text = filter.textContent.trim();
                const section = filter.closest('.filter-section');
                const sectionTitle = section.querySelector('.filter-section-title').textContent.trim();
                
                if (sectionTitle === 'Genre de musique') {
                    activeFilters.genres.push(text);
                } else if (sectionTitle === "Type d'événement") {
                    activeFilters.types.push(text);
                } else if (sectionTitle === 'Date') {
                    activeFilters.dates.push(text);
                } else if (sectionTitle === 'Distance') {
                    activeFilters.distances.push(text);
                }
            });
            
            // Apply filters
            const filteredEvents = applyFilters(allEvents);
            createEventMarkers(filteredEvents);
            
            // Close drawer
            closeFilterDrawer();
        });
    }
});

/* ---------- Fermer le panneau de bienvenue ---------- */
function closeWelcomePanel() {
    const welcomeOverlay = document.getElementById('welcome-overlay');
    welcomeOverlay.classList.remove('show');
}

/* ---------- Appliquer les filtres ---------- */
function applyFilters(events) {
    let filtered = [...events];
    
    // Filtrer par genre
    if (activeFilters.genres.length > 0) {
        filtered = filtered.filter(event => {
            if (!event.keywords_fr) return false;
            const keywords = event.keywords_fr.toLowerCase();
            return activeFilters.genres.some(genre => 
                keywords.includes(genre.toLowerCase()) ||
                (event.title_fr && event.title_fr.toLowerCase().includes(genre.toLowerCase()))
            );
        });
    }
    
    // Filtrer par type (Concert/Festival)
    if (activeFilters.types.length > 0) {
        filtered = filtered.filter(event => {
            if (!event.keywords_fr && !event.title_fr) return false;
            const text = ((event.keywords_fr || '') + ' ' + (event.title_fr || '')).toLowerCase();
            return activeFilters.types.some(type => text.includes(type.toLowerCase()));
        });
    }
    
    // Filtrer par date
    if (activeFilters.dates.length > 0) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const monthEnd = new Date(today);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        filtered = filtered.filter(event => {
            if (!event.daterange_fr) return false;
            
            // Parse date (format: DD/MM/YYYY)
            const dateMatch = event.daterange_fr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (!dateMatch) return false;
            
            const eventDate = new Date(dateMatch[3], dateMatch[2] - 1, dateMatch[1]);
            
            return activeFilters.dates.some(dateFilter => {
                if (dateFilter === "Aujourd'hui") {
                    return eventDate.toDateString() === today.toDateString();
                } else if (dateFilter === "Cette semaine") {
                    return eventDate >= today && eventDate <= weekEnd;
                } else if (dateFilter === "Ce mois-ci") {
                    return eventDate >= today && eventDate <= monthEnd;
                } else if (dateFilter === "Plus tard") {
                    return eventDate > monthEnd;
                }
                return false;
            });
        });
    }
    
    // Filtrer par distance
    if (activeFilters.distances.length > 0 && !activeFilters.distances.includes('Peu importe')) {
        if (userLat && userLon) {
            filtered = filtered.filter(event => {
                if (!event.location_coordinates) return false;
                
                const distance = calculateDistance(
                    userLat, userLon,
                    event.location_coordinates.lat,
                    event.location_coordinates.lon
                );
                
                return activeFilters.distances.some(distFilter => {
                    const maxDist = parseInt(distFilter);
                    return distance <= maxDist;
                });
            });
        }
    }
    
    return filtered;
}

/* ---------- Calculer la distance entre deux points (Haversine) ---------- */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/* ---------- API Île-de-France Concerts ---------- */
const urls = [
    'https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets/evenements-publics-cibul/records?limit=100&refine=keywords_fr%3A"concert"&refine=location_department%3A"Paris"',
    'https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets/evenements-publics-cibul/records?limit=100&offset=100&refine=keywords_fr%3A"concert"&refine=location_department%3A"Paris"',
    'https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets/evenements-publics-cibul/records?limit=100&offset=200&refine=keywords_fr%3A"concert"&refine=location_department%3A"Paris"',
    'https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets/evenements-publics-cibul/records?limit=100&offset=300&refine=keywords_fr%3A"concert"&refine=location_department%3A"Paris"',
    'https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets/evenements-publics-cibul/records?limit=100&offset=400&refine=keywords_fr%3A"concert"&refine=location_department%3A"Paris"'
];

let allEvents = []; // Store all events globally for search

Promise.all(urls.map(url => fetch(url).then(res => res.json())))
    .then(responses => {
        allEvents = responses.flatMap(r => r.results);

        createEventMarkers(allEvents);
        addVenueMarkers(); // Ajouter les marqueurs des grandes salles
        fillEventList(allEvents);
    })
    .catch(error => console.error("Erreur API Paris concerts :", error));


/* ---------- Liste des événements ---------- */
function fillEventList(events) {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = "";

    events.forEach(event => {
        const li = document.createElement('li');
        li.textContent = `${event.title_fr} – ${event.daterange_fr || ""}`;
        eventList.appendChild(li);
    });
}

/* ---------- Géolocalisation ---------- */
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        position => {
            userLat = position.coords.latitude;
            userLon = position.coords.longitude;

            map.setView([userLat, userLon], 12);

            userMarker = L.marker([userLat, userLon], { icon: createUserIcon(12) })
                .addTo(map)
                .bindPopup("Vous êtes ici");
        },
        () => alert("Géolocalisation indisponible")
    );
}

/* ---------- Bouton centrage ---------- */
document.getElementById("center").addEventListener("click", () => {
    if (userLat && userLon) {
        map.flyTo([userLat, userLon], 15, { duration: 1 });
    }
});

/* ---------- Toggle Map Search ---------- */
function toggleMapSearch() {
    const searchContainer = document.getElementById('map-search-container');
    const searchInput = document.getElementById('map-search-input');
    const filterBtn = document.getElementById('filter-btn');
    
    if (searchContainer.classList.contains('visible')) {
        searchContainer.classList.remove('visible');
        searchInput.value = '';
        // Reset markers to show all events
        createEventMarkers(allEvents);
        // Show filter button
        if (filterBtn) filterBtn.style.display = 'flex';
    } else {
        searchContainer.classList.add('visible');
        searchInput.focus();
        // Hide filter button
        if (filterBtn) filterBtn.style.display = 'none';
    }
}

/* ---------- Map Search Functionality ---------- */
document.addEventListener('DOMContentLoaded', function() {
    const mapSearchInput = document.getElementById('map-search-input');
    
    if (mapSearchInput) {
        mapSearchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            const eventListDrawer = document.getElementById('event-list-drawer');
            const isDrawerOpen = eventListDrawer && eventListDrawer.classList.contains('open');
            
            if (searchTerm === '') {
                if (isDrawerOpen) {
                    fillEventListDrawer(allEvents);
                } else {
                    createEventMarkers(allEvents);
                }
                return;
            }
            
            const filteredEvents = allEvents.filter(event => {
                const title = (event.title_fr || '').toLowerCase();
                const location = (event.location_name || '').toLowerCase();
                const address = (event.location_address || '').toLowerCase();
                const city = (event.location_city || '').toLowerCase();
                
                return title.includes(searchTerm) || 
                       location.includes(searchTerm) || 
                       address.includes(searchTerm) ||
                       city.includes(searchTerm);
            });
            
            if (isDrawerOpen) {
                fillEventListDrawer(filteredEvents);
            } else {
                createEventMarkers(filteredEvents);
            }
        });
    }
});

/* ---------- Toggle Event List ---------- */
function toggleEventList() {
    const drawer = document.getElementById('event-list-drawer');
    drawer.classList.toggle('open');
    
    if (drawer.classList.contains('open')) {
        fillEventListDrawer(allEvents);
        hideBottomNav();
    } else {
        showBottomNav();
    }
}

function closeEventList() {
    const drawer = document.getElementById('event-list-drawer');
    drawer.classList.remove('open');
    showBottomNav();
}

/* ---------- Fill Event List Drawer ---------- */
function fillEventListDrawer(events) {
    const container = document.getElementById('event-list-content');
    container.innerHTML = '';
    
    // Sort events by date (upcoming first)
    const sortedEvents = [...events].sort((a, b) => {
        const dateA = new Date(a.daterange_fr || '2099-12-31');
        const dateB = new Date(b.daterange_fr || '2099-12-31');
        return dateA - dateB;
    });
    
    // Take first 20 events
    const upcomingEvents = sortedEvents.slice(0, 20);
    
    upcomingEvents.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-list-card';
        card.onclick = () => {
            closeEventList();
            openEventDrawer(event);
        };
        
        const dateText = event.daterange_fr || 'Date à confirmer';
        const locationText = event.location_name || event.location_address || 'Lieu à confirmer';
        const randomImage = getRandomEventImage();
        
        card.innerHTML = `
            <div class="event-list-image" style="background-image: url('${randomImage}'); background-size: cover; background-position: center;">
            </div>
            <div class="event-list-info">
                <p class="event-list-date">${dateText}</p>
                <h3 class="event-list-title">${event.title_fr || 'Sans titre'}</h3>
                <p class="event-list-location">${locationText}</p>
            </div>
        `;
        
        container.appendChild(card);
    });
}
