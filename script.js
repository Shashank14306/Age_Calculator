// ============================================
// Age Calculator — Logic
// ============================================

// Grab references to all the elements we need to read from or update.
const ageForm = document.getElementById('ageForm');
const birthDateInput = document.getElementById('birthDate');
const errorMessage = document.getElementById('errorMessage');
const resetBtn = document.getElementById('resetBtn');

const resultSection = document.getElementById('resultSection');
const yearsValue = document.getElementById('yearsValue');
const monthsValue = document.getElementById('monthsValue');
const daysValue = document.getElementById('daysValue');
const totalDaysValue = document.getElementById('totalDaysValue');
const nextBirthdayCountdown = document.getElementById('nextBirthdayCountdown');
const nextBirthdayDate = document.getElementById('nextBirthdayDate');

// Restrict the date picker so users can't pick a future date in the first place.
// This is a helpful UI hint, but we still validate again in JS since users can
// type dates manually or the browser's native picker support can vary.
const today = new Date();
birthDateInput.max = formatDateForInput(today);

// Handle form submission (the "Calculate Age" button).
ageForm.addEventListener('submit', function (event) {
  event.preventDefault(); // Stop the page from reloading.
  calculateAge();
});

// Handle the "Reset" button.
resetBtn.addEventListener('click', function () {
  resetCalculator();
});

/**
 * Main calculation flow:
 * 1. Read and validate the birth date.
 * 2. Work out the years/months/days difference.
 * 3. Work out total days lived and days until next birthday.
 * 4. Render everything to the page.
 */
function calculateAge() {
  const rawValue = birthDateInput.value;

  // No date entered at all.
  if (!rawValue) {
    showError('Please select your date of birth.');
    return;
  }

  // The <input type="date"> value is in YYYY-MM-DD format.
  // We build the Date manually (rather than `new Date(rawValue)`) so the
  // date is treated as local time, avoiding timezone shift bugs where
  // a date can appear to be one day off.
  const [year, month, day] = rawValue.split('-').map(Number);
  const birthDate = new Date(year, month - 1, day);

  // Check the date is actually a real calendar date.
  // (Guards against edge cases like a malformed value slipping through.)
  const isRealDate =
    birthDate.getFullYear() === year &&
    birthDate.getMonth() === month - 1 &&
    birthDate.getDate() === day;

  if (!isRealDate) {
    showError('That date does not exist. Please check the day and month.');
    return;
  }

  const now = new Date();
  // Normalize "today" to midnight so we compare whole days only,
  // not hours/minutes/seconds.
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Reject future dates of birth.
  if (birthDate > todayMidnight) {
    showError('Date of birth cannot be in the future.');
    return;
  }

  // Valid date — clear any previous error and proceed.
  hideError();

  const age = getYearsMonthsDays(birthDate, todayMidnight);
  const totalDays = getTotalDaysLived(birthDate, todayMidnight);
  const nextBirthday = getNextBirthdayInfo(birthDate, todayMidnight);

  displayResults(age, totalDays, nextBirthday);
}

/**
 * Calculates the difference between two dates as whole years, months, and days,
 * the way people naturally describe age (e.g. "21 years, 3 months, 15 days").
 *
 * This handles leap years and different month lengths correctly because it
 * borrows days/months from the calendar itself (via Date's day-overflow
 * behavior) rather than assuming a fixed 30-day month or 365-day year.
 */
function getYearsMonthsDays(birthDate, today) {
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  // If the day count is negative, we "borrow" days from the previous month.
  // Using day 0 of a given month/year returns the last day of the month
  // before it — this automatically accounts for 28/29/30/31-day months.
  if (days < 0) {
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += previousMonth.getDate();
    months -= 1;
  }

  // If the month count is negative, borrow a year's worth of months.
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days };
}

/**
 * Total whole days lived, calculated from the millisecond difference
 * between the two dates.
 */
function getTotalDaysLived(birthDate, today) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const diffInMs = today.getTime() - birthDate.getTime();
  return Math.round(diffInMs / millisecondsPerDay);
}

/**
 * Works out the date of the person's next birthday and how many days
 * remain until it. Handles the leap-year edge case where someone is
 * born on Feb 29 by celebrating on Feb 28 in non-leap years.
 */
function getNextBirthdayInfo(birthDate, today) {
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  // Start by assuming the next birthday is this calendar year.
  let nextBirthdayYear = today.getFullYear();
  let candidate = buildSafeBirthday(nextBirthdayYear, birthMonth, birthDay);

  // If that date has already passed (or is today, which is handled by the
  // calculation above already), move to next year instead.
  if (candidate < today) {
    nextBirthdayYear += 1;
    candidate = buildSafeBirthday(nextBirthdayYear, birthMonth, birthDay);
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysUntil = Math.round((candidate.getTime() - today.getTime()) / millisecondsPerDay);

  return { date: candidate, daysUntil };
}

/**
 * Builds a birthday date for a given year, safely handling Feb 29
 * for people born on a leap day. In non-leap years their birthday
 * is observed on Feb 28.
 */
function buildSafeBirthday(year, month, day) {
  const isFeb29 = month === 1 && day === 29;
  if (isFeb29 && !isLeapYear(year)) {
    return new Date(year, 1, 28); // Feb 28
  }
  return new Date(year, month, day);
}

/**
 * Standard leap year rule: divisible by 4, but not by 100 unless also by 400.
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Renders the calculated results into the result card.
 */
function displayResults(age, totalDays, nextBirthday) {
  yearsValue.textContent = age.years;
  monthsValue.textContent = age.months;
  daysValue.textContent = age.days;

  totalDaysValue.textContent = totalDays.toLocaleString();

  const countdownText =
    nextBirthday.daysUntil === 0 ? 'Today! 🎉' : `${nextBirthday.daysUntil.toLocaleString()} days`;
  nextBirthdayCountdown.textContent = countdownText;

  nextBirthdayDate.textContent = formatDateForDisplay(nextBirthday.date);

  // Re-trigger the reveal animation each time by toggling the class.
  resultSection.classList.remove('visible');
  // Force a reflow so the browser registers the class removal before we add it back.
  void resultSection.offsetWidth;
  resultSection.classList.add('visible');
}

/**
 * Shows an error message and hides the result section (since results
 * would be based on invalid input).
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('visible');
  resultSection.classList.remove('visible');
}

function hideError() {
  errorMessage.textContent = '';
  errorMessage.classList.remove('visible');
}

/**
 * Resets the form and result section back to their initial state.
 */
function resetCalculator() {
  ageForm.reset();
  hideError();
  resultSection.classList.remove('visible');
}

/**
 * Formats a Date object as YYYY-MM-DD for use as an <input type="date"> value.
 */
function formatDateForInput(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formats a Date object as a friendly, readable string, e.g. "12 March 2027".
 */
function formatDateForDisplay(date) {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
