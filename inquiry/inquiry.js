
const timelineOptions = [
 {label:'In 1 week',days:7,description:'A tight launch window. Let’s discuss a focused scope and what’s ready to go.'},
 {label:'In 2 weeks',days:14,description:'A quick turnaround. Having your content and project priorities ready will help.'},
 {label:'In 3 weeks',days:21,description:'A little more room to design, build, and review a focused website.'},
 {label:'In 1 month',months:1,description:'Time to shape the design, build the website, and refine the details.'},
 {label:'In 2 months',months:2,description:'More room for planning, content preparation, and a considered design process.'},
 {label:'In 3 months',months:3,description:'An early start for a larger project, a brand refresh, or a more involved build.'}
];
const timelineRange = document.getElementById('timeline-range');
const timelineStart = new Date();
function getLaunchDate(start, option) {
 const date = new Date(start.getTime());
 if (option.days) date.setDate(date.getDate() + option.days);
 else {
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + option.months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
 }
 return date;
}
function updateTimeline() {
 const index = Number(timelineRange.value);
 const option = timelineOptions[index];
 const date = getLaunchDate(timelineStart, option).toLocaleDateString('en', {month:'short',day:'numeric',year:'numeric'});
 document.getElementById('timeline-label').textContent = option.label;
 document.getElementById('timeline-date').textContent = 'Around ' + date;
 document.getElementById('timeline-description').textContent = option.description;
 document.getElementById('timeline').value = option.label + ' (around ' + date + ')';
 timelineRange.setAttribute('aria-valuetext', option.label + ', around ' + date);
 timelineRange.style.setProperty('--range-fill', (index / (timelineOptions.length - 1) * 100) + '%');
}
timelineRange.addEventListener('input', updateTimeline);
updateTimeline();


const form = document.getElementById('inquiry-form');
const otherField = document.getElementById('other-service-field');
const otherInput = document.getElementById('other-service');
function updateOtherService() {
 const active = form.querySelector('input[name="service"]:checked')?.value === 'I have something else in mind';
 otherField.hidden = !active;
 otherInput.disabled = !active;
 otherInput.required = active;
 if (!active) { otherInput.setCustomValidity(''); otherInput.removeAttribute('aria-invalid'); document.getElementById('other-error').textContent = ''; }
}
form.querySelectorAll('input[name="service"]').forEach(input => input.addEventListener('change', updateOtherService));
updateOtherService();

// Narrow, transparent checks for obvious junk; never infer identity or use a name dictionary.
function obviousKeyboardSmash(value) {
 const compact = value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
 if (/^(.)\1{5,}$/.test(compact)) return true;
 if (compact.length < 6) return false;
 const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890', 'abcdefghijklmnopqrstuvwxyz'];
 if (rows.some(row => row.includes(compact) || [...row].reverse().join('').includes(compact))) return true;
 const repeated = compact.match(/^(.{6,10})\1+$/);
 return Boolean(repeated && rows.some(row => row.includes(repeated[1]) || [...row].reverse().join('').includes(repeated[1])));
}
function inquiryTextError(value, kind) {
 const text = value.trim();
 if (!text) return kind === 'name' ? 'Please enter your name.' : 'Please tell us a little about your project.';
 if (!/\p{L}/u.test(text)) return kind === 'name' ? 'Please enter a name with letters.' : 'Please describe what you’d like to make.';
 if (obviousKeyboardSmash(text)) return kind === 'name' ? 'Please check your name; this looks like repeated keys.' : 'Please describe your idea in your own words rather than repeated keys.';
 if (kind !== 'name') {
  if ([...text].length < 15) return 'Please add a little more detail (at least 15 characters).';
  if (/^[a-z]{25,}$/i.test(text)) return 'Please add a short description with a few words about your project.';
 }
 return '';
}
function validateText(input, kind, errorId) {
 const error = inquiryTextError(input.value, kind);
 input.setCustomValidity(error);
 input.setAttribute('aria-invalid', String(Boolean(error)));
 document.getElementById(errorId).textContent = error;
 return !error;
}
const checkedFields = [
 [document.getElementById('name'), 'name', 'name-error'],
 [document.getElementById('brief'), 'brief', 'brief-error'],
 [otherInput, 'brief', 'other-error']
];
checkedFields.forEach(([input, kind, errorId]) => {
 input.addEventListener('blur', () => { if (!input.disabled && input.value.trim()) validateText(input, kind, errorId); });
 input.addEventListener('input', () => {
  // Clear stale native errors immediately; validate again on blur or submission.
  input.setCustomValidity(''); input.removeAttribute('aria-invalid');
  document.getElementById(errorId).textContent = '';
 });
});
// JS manages the order so field explanations show before native validity prompts.
form.noValidate = true;
form.addEventListener('submit', function(event) {
 event.preventDefault();
 checkedFields.forEach(([input, kind, errorId]) => { if (!input.disabled) validateText(input, kind, errorId); });
 if (!this.reportValidity()) return;
 const values = new FormData(this);
 const get = key => String(values.get(key) || '').trim();
 const subject = 'Website inquiry — ' + (get('business') || get('name')).replace(/[\r\n]/g, ' ');
 const body = ['Hi Dexite,', '', 'Name: '+get('name'), 'Email: '+get('email'), 'Business: '+(get('business') || 'Not provided'), 'Current website: '+(get('website') || 'None provided'), 'Looking for: '+get('service'), ...(otherInput.disabled ? [] : ['Other request: '+get('otherService')]), 'Timeline: '+get('timeline'), '', 'Project details:', get('brief')].join('\r\n');
 window.location.href = 'mailto:dex@dexite.dev?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
 document.getElementById('status').textContent = 'Your email app should open with your draft. Your inquiry reaches us after you press send. If it didn’t open, use the direct email link above.';
});
