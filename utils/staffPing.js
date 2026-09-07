const STAFF_KEYWORDS = [
  /\bhuman\b/i,
  /\breal person\b/i,
  /\bstaff\b/i,
  /\bmoderator\b/i,
  /\badmin(istrator)?\b/i,
  /\bagent\b/i,
  /\bmanager\b/i,
  /\bsupport team\b/i,
  /\btalk to (a |an )?(person|someone|human)\b/i,
  /\bspeak (to|with) (a |an )?(human|person|staff|someone)\b/i,
  /\b(get|call|need|want) (a |an )?(human|staff|mod|admin|person)\b/i,
];

function wantsStaff(content) {
  if (!content) return false;
  return STAFF_KEYWORDS.some((re) => re.test(content));
}

module.exports = { wantsStaff };
