/* Fleet Management App
  - data persisted in localStorage under key 'fleets_v1'
  - supports add, delete (confirm), update driver (prompt), toggle availability, combined filters, clear filters, clear all data
*/
// config
const STORAGE_KEY = 'fleets_v1';
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=3c3d4085d9b3d7e5d1f8e02d8f5b3f2e';
// util storage
function readFleets(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){return [];} }
function writeFleets(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }
// id
function uid(){ return 'f_' + Math.random().toString(36).slice(2,9); }
// safe text
function esc(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
// create card element
function createCard(fleet){
 const el = document.createElement('div');
 el.className = 'card';
el.dataset.id = fleet.id;
 const availLabel = fleet.isAvailable ? 'Available' : 'Unavailable';
 el.innerHTML = `
<div class="thumb" style="background-image:url('${esc(fleet.image || DEFAULT_IMG)}')"></div>
<h3>${esc(fleet.regNo)}</h3>
<div class="meta">${esc(fleet.category)} • <strong>${esc(availLabel)}</strong></div>
<p style="margin-bottom:8px;"><em>Driver:</em> ${esc(fleet.driver)}</p>
<div class="card-actions">
<button class="muted" data-action="update">Update Driver</button>
<button class="muted" data-action="toggle">${fleet.isAvailable ? 'Set Unavailable' : 'Set Available'}</button>
<button class="danger" data-action="delete">Delete</button>
</div>
 `;
 return el;
}
// render grid with filters
function render({category='All', availability='All'} = {}){
 const grid = document.getElementById('fleetGrid');
 if(!grid) return; // not on page
 let fleets = readFleets();
 if(category && category !== 'All'){
   fleets = fleets.filter(f => f.category === category);
 }
 if(availability && availability !== 'All'){
   const want = availability === 'Available';
   fleets = fleets.filter(f => f.isAvailable === want);
 }
 grid.innerHTML = '';
 if(fleets.length === 0){
   grid.innerHTML = '<p class="small-note">No fleets to show.</p>';
 } else {
   fleets.forEach(f => grid.appendChild(createCard(f)));
 }
 // update total count
 const total = readFleets().length;
 const totalEl = document.getElementById('totalCount');
 if(totalEl) totalEl.textContent = total;
}
// delegated click handler for card actions
function attachCardHandler(){
 const grid = document.getElementById('fleetGrid');
 if(!grid) return;
 grid.addEventListener('click', (e) => {
   const btn = e.target.closest('button[data-action]');
   if(!btn) return;
   const action = btn.dataset.action;
   const card = btn.closest('.card');
   const id = card?.dataset.id;
   if(!id) return;
   let fleets = readFleets();
   const idx = fleets.findIndex(f => f.id === id);
   if(idx === -1) return;
   if(action === 'delete'){
     if(!confirm('Delete this vehicle?')) return;
     fleets.splice(idx,1);
     writeFleets(fleets);
     render(getFiltersFromUI());
   } else if(action === 'update'){
     const current = fleets[idx].driver || '';
     const name = prompt('Enter new driver name:', current);
     // if cancel => null, if empty or whitespace -> do not update
     if(name === null) return;
     const cleaned = name.trim();
     if(cleaned.length === 0){ alert('Driver name cannot be empty.'); return; }
     fleets[idx].driver = cleaned;
     writeFleets(fleets);
     render(getFiltersFromUI());
   } else if(action === 'toggle'){
     fleets[idx].isAvailable = !fleets[idx].isAvailable;
     writeFleets(fleets);
     render(getFiltersFromUI());
   }
 });
}
// form submit: add fleet
function attachFormHandler(){
 const form = document.getElementById('fleetForm');
 if(!form) return;
 form.addEventListener('submit', (e) => {
   e.preventDefault();
   const regNo = document.getElementById('regNo').value.trim();
   const category = document.getElementById('category').value;
   const driver = document.getElementById('driver').value.trim();
   const isAvailable = document.getElementById('isAvailable').checked;
   if(!regNo || !category || !driver){
     alert('Please fill Reg No, Category and Driver.');
     return;
   }
   const fleets = readFleets();
   fleets.push({
     id: uid(),
     regNo,
     category,
     driver,
     isAvailable,
     image: DEFAULT_IMG
   });
   writeFleets(fleets);
   form.reset();
   render(getFiltersFromUI());
 });
 // clear all fleets button
 const clearBtn = document.getElementById('clearAll');
 if(clearBtn){
   clearBtn.addEventListener('click', () => {
     if(!confirm('Clear all fleets from storage?')) return;
     localStorage.removeItem(STORAGE_KEY);
     render(getFiltersFromUI());
   });
 }
}
// filter controls
function setupFilters(){
 const cat = document.getElementById('navCategoryFilter');
 const avail = document.getElementById('navAvailabilityFilter');
 const clear = document.getElementById('clearFilters');
 function onChange(){
   render({category: cat.value, availability: avail.value});
 }
 if(cat) cat.addEventListener('change', onChange);
 if(avail) avail.addEventListener('change', onChange);
 if(clear) clear.addEventListener('click', () => {
   cat.value = 'All';
   avail.value = 'All';
   render({category:'All', availability:'All'});
 });
}
// helper to read filters state
function getFiltersFromUI(){
 const cat = document.getElementById('navCategoryFilter');
 const avail = document.getElementById('navAvailabilityFilter');
 return { category: cat ? cat.value : 'All', availability: avail ? avail.value : 'All' };
}
// init
document.addEventListener('DOMContentLoaded', () => {
 // if admin page
 if(document.getElementById('fleetGrid')){
   setupFilters();
   attachFormHandler();
   attachCardHandler();
   render(getFiltersFromUI());
 }
});