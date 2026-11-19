// Library rules (change these numbers if your library uses different rules)
module.exports = {
  MAX_ACTIVE_RESERVATIONS: 3, // a student can hold at most 3 books (reserved + issued)
  LOAN_DAYS: 14, // an issued book must be returned within 14 days
  PICKUP_DAYS: 2, // a reserved book must be collected within 2 days, or it expires
  RENEW_DAYS: 7, // renewing adds 7 more days to the due date
  MAX_RENEWALS: 1, // a book can be renewed only once
  FINE_PER_DAY: 2, // late fine in rupees for each day after the due date
  DUE_SOON_DAYS: 2, // send a "due soon" alert this many days before the due date
};
