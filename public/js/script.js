// ===== APP STATE =====
const state = {
  user: null,
  hasVehicle: true,
  vehicleType: 'bike',
  role: null,
  currentPage: 'landing',
  pageHistory: [],
  riderMap: null,
  passMap: null,
  rides: [],
  currentRoute: null,
  passRoute: null
};

// ===== SPLASH SCREEN =====
window.addEventListener('load', () => {
  const saved = localStorage.getItem('campusride_user');
  if (saved) { state.user = JSON.parse(saved); }

  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').classList.add('show');
      updateNav();
    }, 600);
  }, 2800);
});

// ===== NAVIGATION =====
function showPage(id) {
  if (state.currentPage !== id) {
    state.pageHistory.push(state.currentPage);
  }
  state.currentPage = id;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('active');

  updateNav();
  window.scrollTo(0, 0);

  // Init maps when needed
  if (id === 'riderMap') setTimeout(() => initRiderMap(), 200);
  if (id === 'passengerMap') setTimeout(() => initPassMap(), 200);
}

function goBack() {
  if (state.pageHistory.length > 0) {
    const prev = state.pageHistory.pop();
    state.currentPage = prev;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + prev)?.classList.add('active');
    updateNav();
    window.scrollTo(0, 0);
  }
}

function updateNav() {
  const isLanding = state.currentPage === 'landing';
  const back = document.getElementById('navBack');
  const login = document.getElementById('navLogin');
  const how = document.getElementById('navHow');

  back.classList.toggle('visible', !isLanding);
  if (login) {
    login.textContent = state.user ? '🟢 ' + state.user.name.split(' ')[0] : 'Get Started';
    if (state.user) login.onclick = () => showPage('role');
    else login.onclick = () => showPage('register');
  }
  if (how) how.style.display = isLanding ? '' : 'none';
}

// ===== NAVBAR SCROLL EFFECT =====
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
});

// ===== ABOUT MODAL =====
function openAbout() {
  document.getElementById('aboutModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeAbout() {
  document.getElementById('aboutModal').classList.remove('show');
  document.body.style.overflow = '';
}
document.getElementById('aboutModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeAbout();
});

// ===== TOAST =====
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== REGISTER =====
async function handleRegister(e) {
  e.preventDefault();
  const userPayload = {
    name: document.getElementById('regName').value.trim(),
    phone: document.getElementById('regPhone').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    address: document.getElementById('regAddress').value.trim(),
    city: document.getElementById('regCity').value.trim(),
    state: document.getElementById('regState').value.trim(),
    pincode: document.getElementById('regPincode').value.trim()
  };

  if (!userPayload.name || !userPayload.phone || !userPayload.email) {
    showToast('Please fill all required fields', true);
    return;
  }

  try {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload)
    });
    const data = await res.json();
    if (data.success) {
      state.user = data.user;
      localStorage.setItem('campusride_user', JSON.stringify(state.user));
      showToast('Welcome, ' + state.user.name.split(' ')[0] + '! 🎉');
      showPage('vehicle');
    } else {
      showToast(data.message || 'Error registering', true);
    }
  } catch (err) {
    showToast('Network error while registering', true);
  }
}

// ===== VEHICLE =====
function toggleVehicle(val) {
  state.hasVehicle = val === 'yes';
  document.querySelectorAll('#vehicleToggle .toggle-option').forEach(o => {
    o.classList.toggle('active', o.dataset.value === val);
  });
  document.getElementById('vehicleFields').classList.toggle('hidden', val === 'no');
}

function toggleVType(val) {
  state.vehicleType = val;
  document.querySelectorAll('#vehicleType .toggle-option').forEach(o => {
    o.classList.toggle('active', o.dataset.value === val);
  });
}

async function handleVehicle() {
  if (state.hasVehicle) {
    const plate = document.getElementById('vPlate').value.trim();
    const license = document.getElementById('vLicense').value.trim();
    if (!plate || !license) {
      showToast('Please enter plate number & license', true);
      return;
    }
    
    const vehicle = {
      type: state.vehicleType,
      plate: plate.toUpperCase(),
      license: license.toUpperCase()
    };

    try {
      const res = await fetch('/api/users/' + state.user._id + '/vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle })
      });
      const data = await res.json();
      if (data.success) {
        state.user = data.user;
        localStorage.setItem('campusride_user', JSON.stringify(state.user));
        showToast('Vehicle registered! 🏍️');
      }
    } catch (err) {
      showToast('Error saving vehicle', true);
    }
  }
  showPage('role');
}

// ===== ROLE =====
function selectRole(role) {
  state.role = role;
  document.getElementById('roleRider').classList.toggle('selected', role === 'rider');
  document.getElementById('rolePassenger').classList.toggle('selected', role === 'passenger');
  document.getElementById('roleContinue').disabled = false;

  if (role === 'rider' && (!state.user.vehicle || !state.user.vehicle.plate)) {
    showToast('You need a vehicle to be a Rider', true);
    state.role = null;
    document.getElementById('roleRider').classList.remove('selected');
    document.getElementById('roleContinue').disabled = true;
    return;
  }
}

function handleRole() {
  if (!state.role) return;
  if (state.role === 'rider') showPage('riderMap');
  else showPage('passengerMap');
}

// ===== MAPS (Leaflet + OpenStreetMap) =====
const SAMPLE_ROUTES = [
  { name: 'Anna Nagar -> SRM College', src: [13.0850, 80.2101], dst: [12.8231, 80.0444], dist: 32 },
  { name: 'T. Nagar -> SRM College', src: [13.0418, 80.2341], dst: [12.8231, 80.0444], dist: 28 },
  { name: 'Tambaram -> SRM College', src: [12.9249, 80.1000], dst: [12.8231, 80.0444], dist: 12 },
  { name: 'Velachery -> SRM College', src: [12.9815, 80.2180], dst: [12.8231, 80.0444], dist: 22 },
  { name: 'Guindy -> SRM College', src: [13.0067, 80.2206], dst: [12.8231, 80.0444], dist: 25 },
];

function initRiderMap() {
  if (state.riderMap) state.riderMap.remove();
  const container = document.getElementById('riderMapDisplay');
  if (!container) return;

  state.riderMap = L.map(container).setView([12.95, 80.15], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(state.riderMap);

  const srcInput = document.getElementById('riderSource');
  const dstInput = document.getElementById('riderDest');
  let markers = [];
  let routeLine = null;

  function updateRoute() {
    const src = srcInput.value.trim();
    const dst = dstInput.value.trim();
    if (src.length > 2 && dst.length > 2) {
      const route = findClosestRoute(src, dst);
      markers.forEach(m => state.riderMap.removeLayer(m));
      if (routeLine) state.riderMap.removeLayer(routeLine);

      const srcMarker = L.marker(route.src).addTo(state.riderMap).bindPopup('📍 ' + src);
      const dstMarker = L.marker(route.dst).addTo(state.riderMap).bindPopup('🏁 ' + dst);
      markers = [srcMarker, dstMarker];

      const midLat = (route.src[0] + route.dst[0]) / 2 + 0.02;
      const midLng = (route.src[1] + route.dst[1]) / 2 - 0.02;
      routeLine = L.polyline([route.src, [midLat, midLng], route.dst], {
        color: '#4F46E5', weight: 4, opacity: 0.8, dashArray: '10, 6'
      }).addTo(state.riderMap);

      state.riderMap.fitBounds(L.latLngBounds(route.src, route.dst).pad(0.3));

      const dist = route.dist;
      const time = Math.round(dist * 2.2);
      const fare = dist * 5;

      document.getElementById('riderDistance').textContent = dist + ' km';
      document.getElementById('riderTime').textContent = time + ' min';
      document.getElementById('riderFare').textContent = '₹' + fare;
      document.getElementById('riderRouteSummary').classList.add('show');

      document.getElementById('rBaseFare').textContent = '₹' + fare;
      document.getElementById('rEarnFare').textContent = '₹' + Math.round(fare / 2);
      document.getElementById('riderFareCard').classList.add('show');
      document.getElementById('riderGoBtn').disabled = false;

      state.currentRoute = { src, dst, srcCoord: route.src, dstCoord: route.dst, dist, fare, time };
    }
  }

  srcInput.addEventListener('input', debounce(updateRoute, 600));
  dstInput.addEventListener('input', debounce(updateRoute, 600));
}

function initPassMap() {
  if (state.passMap) state.passMap.remove();
  const container = document.getElementById('passMapDisplay');
  if (!container) return;

  state.passMap = L.map(container).setView([12.95, 80.15], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(state.passMap);

  const srcInput = document.getElementById('passSource');
  const dstInput = document.getElementById('passDest');
  let markers = [];
  let routeLine = null;

  function updateRoute() {
    const src = srcInput.value.trim();
    const dst = dstInput.value.trim();
    if (src.length > 2 && dst.length > 2) {
      const route = findClosestRoute(src, dst);
      markers.forEach(m => state.passMap.removeLayer(m));
      if (routeLine) state.passMap.removeLayer(routeLine);

      const srcMarker = L.marker(route.src).addTo(state.passMap).bindPopup('📍 ' + src);
      const dstMarker = L.marker(route.dst).addTo(state.passMap).bindPopup('🏁 ' + dst);
      markers = [srcMarker, dstMarker];

      const midLat = (route.src[0] + route.dst[0]) / 2 + 0.02;
      const midLng = (route.src[1] + route.dst[1]) / 2 - 0.02;
      routeLine = L.polyline([route.src, [midLat, midLng], route.dst], {
        color: '#FB7185', weight: 4, opacity: 0.8, dashArray: '10, 6'
      }).addTo(state.passMap);

      state.passMap.fitBounds(L.latLngBounds(route.src, route.dst).pad(0.3));

      const dist = route.dist;
      const time = Math.round(dist * 2.2);

      document.getElementById('passDistance').textContent = dist + ' km';
      document.getElementById('passTime').textContent = time + ' min';
      document.getElementById('passRouteSummary').classList.add('show');
      document.getElementById('passSearchBtn').disabled = false;

      state.passRoute = { src, dst, srcCoord: route.src, dstCoord: route.dst, dist, time };
    }
  }

  srcInput.addEventListener('input', debounce(updateRoute, 600));
  dstInput.addEventListener('input', debounce(updateRoute, 600));
}

function findClosestRoute(src, dst) {
  const srcLow = src.toLowerCase();
  const dstLow = dst.toLowerCase();

  for (const r of SAMPLE_ROUTES) {
    const name = r.name.toLowerCase();
    if (name.includes(srcLow.substring(0, 4)) || name.includes(dstLow.substring(0, 4))) {
      return r;
    }
  }

  const hash = (src + dst).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const srcLat = 12.8 + (hash % 40) / 100;
  const srcLng = 80.0 + (hash % 30) / 100;
  const dstLat = srcLat + (hash % 20 - 10) / 100;
  const dstLng = srcLng + (hash % 15 - 7) / 100;
  const dist = 8 + (hash % 35);

  return { src: [srcLat, srcLng], dst: [dstLat, dstLng], dist };
}

// ===== RIDER POST RIDE =====
async function riderPostRide() {
  if (!state.currentRoute) return;

  try {
    const res = await fetch('/api/rides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        riderId: state.user._id,
        source: state.currentRoute.src,
        destination: state.currentRoute.dst,
        sourceCoord: state.currentRoute.srcCoord,
        destCoord: state.currentRoute.dstCoord,
        distance: state.currentRoute.dist,
        fare: state.currentRoute.fare,
        time: state.currentRoute.time,
        seats: 1
      })
    });
    
    const data = await res.json();
    if (data.success) {
      const ride = data.ride;
      document.getElementById('riderBookingSummary').innerHTML = `
        <h3>Ride Details</h3>
        <div class="summary-row"><span class="label">From</span><span class="value">${ride.source}</span></div>
        <div class="summary-row"><span class="label">To</span><span class="value">${ride.destination}</span></div>
        <div class="summary-row"><span class="label">Distance</span><span class="value">${ride.distance} km</span></div>
        <div class="summary-row"><span class="label">Total Fare</span><span class="value">₹${ride.fare}</span></div>
        <div class="summary-row"><span class="label">Your Earning</span><span class="value" style="color:var(--green)">₹${Math.round(ride.fare/2)}</span></div>
        <div class="summary-row"><span class="label">Seats Available</span><span class="value">1</span></div>
      `;

      showToast('Ride posted! 🎉');
      showPage('riderSuccess');
    } else {
      showToast('Error posting ride', true);
    }
  } catch (err) {
    showToast('Network error while posting ride', true);
  }
}

// ===== PASSENGER SEARCH =====
async function searchRides() {
  if (!state.passRoute) return;

  try {
    const res = await fetch('/api/rides');
    const data = await res.json();
    
    if (data.success) {
      const results = data.rides;
      const container = document.getElementById('rideResults');

      if (results.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            <h3>No rides found</h3>
            <p>No riders are heading your way right now. Try again later!</p>
          </div>`;
      } else {
        container.innerHTML = results.map(r => `
          <div class="ride-card">
            <div class="ride-card-header">
              <div class="rider-avatar">${r.rider && r.rider.name ? r.rider.name.charAt(0) : 'U'}</div>
              <div class="rider-info">
                <h4>${r.rider && r.rider.name ? r.rider.name : 'Unknown Rider'}</h4>
                <p>${r.rider && r.rider.vehicle ? (r.rider.vehicle.type === 'bike' ? '🏍️' : '🛵') + ' ' + r.rider.vehicle.plate : 'Vehicle info N/A'}</p>
              </div>
            </div>
            <div class="ride-route">
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div class="route-dot"></div>
                <div class="route-line-v"></div>
                <div class="route-dot dest"></div>
              </div>
              <div>
                <div class="route-text" style="margin-bottom:12px;">${r.source}</div>
                <div class="route-text">${r.destination}</div>
              </div>
            </div>
            <div class="ride-meta">
              <span class="meta-tag">📏 ${r.distance} km</span>
              <span class="meta-tag">⏱️ ~${r.time} min</span>
              <span class="meta-tag">💺 ${r.seats} seat</span>
            </div>
            <div class="ride-card-footer">
              <div class="ride-fare">₹${Math.round(r.fare / 2)} <span>your share</span></div>
              <button class="btn btn-coral btn-sm" onclick="bookRide('${r._id}', '${r.rider && r.rider.name ? r.rider.name : 'Rider'}', ${r.distance}, ${r.fare})">Book Seat</button>
            </div>
          </div>
        `).join('');
      }

      showPage('results');
    }
  } catch (err) {
    showToast('Error searching rides', true);
  }
}

// ===== BOOK RIDE =====
async function bookRide(id, riderName, distance, fare) {
  try {
    const res = await fetch('/api/rides/' + id + '/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerId: state.user._id })
    });
    
    const data = await res.json();
    if (data.success) {
      document.getElementById('passBookingSummary').innerHTML = `
        <h3>Booking Confirmation</h3>
        <div class="summary-row"><span class="label">Rider</span><span class="value">${riderName}</span></div>
        <div class="summary-row"><span class="label">From</span><span class="value">${state.passRoute?.src || '—'}</span></div>
        <div class="summary-row"><span class="label">To</span><span class="value">${state.passRoute?.dst || '—'}</span></div>
        <div class="summary-row"><span class="label">Distance</span><span class="value">${distance} km</span></div>
        <div class="summary-row"><span class="label">Total Fare</span><span class="value">₹${fare}</span></div>
        <div class="summary-row"><span class="label">Your Share (50%)</span><span class="value" style="color:var(--green)">₹${Math.round(fare/2)}</span></div>
        <div class="summary-row"><span class="label">Status</span><span class="value" style="color:var(--green)">✅ Confirmed</span></div>
      `;

      showToast('Ride booked! 🎉');
      showPage('bookingSuccess');
    } else {
      showToast(data.message || 'Error booking ride', true);
    }
  } catch (err) {
    showToast('Network error while booking', true);
  }
}

// ===== UTILITY =====
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ===== DYNAMIC BACKGROUND PARALLAX =====
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const wrappers = document.querySelectorAll('.blob-wrapper');
  
  if (wrappers.length > 0) {
    // Parallax & Rotation
    wrappers[0].style.transform = `translateY(${scrolled * 0.3}px) rotate(${scrolled * 0.05}deg)`;
    if(wrappers[1]) wrappers[1].style.transform = `translateY(${scrolled * -0.2}px) rotate(${scrolled * -0.05}deg)`;
    if(wrappers[2]) wrappers[2].style.transform = `translateY(${scrolled * 0.15}px) rotate(${scrolled * 0.1}deg)`;
  }
});
