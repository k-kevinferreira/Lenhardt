function trimToString(value, maxLength = null) {
  const text = String(value ?? "").trim();
  if (!maxLength) return text;
  return text.slice(0, maxLength);
}

function normalizeEmail(value) {
  return trimToString(value, 160).toLowerCase();
}

function isValidEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D+/g, "").slice(0, 15);
}

function isValidPhone(value) {
  return /^\d{10,15}$/.test(String(value ?? ""));
}

module.exports = {
  trimToString,
  normalizeEmail,
  isValidEmail,
  normalizePhone,
  isValidPhone,
};
