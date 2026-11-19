// Demo students and their library history (for testing and the project demo).
// Every demo student logs in with the password below.
//
// Each "loan" says which book the student has and what state it is in:
//   reserved -> reserved in the app, not collected yet (daysAgo = when reserved)
//   issued   -> book is with the student (daysAgo = when issued, due 14 days later)
//   returned -> book was given back (daysAgo = when issued, returnedDaysAgo = when returned)
//   waiting  -> student is on the waitlist for the book
const DEMO_PASSWORD = "student123";

const students = [
  {
    name: "Aarav Sharma", rollNumber: "2503A51101", batch: 1,
    loans: [
      { book: "Introduction to Algorithms", status: "issued", daysAgo: 5 },
      { book: "The Psychology of Money", status: "reserved", daysAgo: 0 },
      { book: "Clean Code", status: "returned", daysAgo: 30, returnedDaysAgo: 18 },
    ],
  },
  {
    name: "Ananya Reddy", rollNumber: "2503A51102", batch: 1,
    loans: [
      { book: "Operating System Concepts", status: "issued", daysAgo: 13 }, // due tomorrow
      { book: "Atomic Habits", status: "issued", daysAgo: 3 },
    ],
  },
  {
    name: "Rohan Verma", rollNumber: "2503A51103", batch: 1,
    loans: [
      { book: "Database System Concepts", status: "issued", daysAgo: 19 }, // 5 days overdue
      { book: "The Pragmatic Programmer", status: "issued", daysAgo: 6 },
      { book: "Let Us C", status: "returned", daysAgo: 40, returnedDaysAgo: 22, finePaid: true }, // returned late
    ],
  },
  {
    name: "Priya Nair", rollNumber: "2503A51104", batch: 2,
    loans: [
      { book: "Rich Dad Poor Dad", status: "issued", daysAgo: 8 },
      { book: "Ikigai", status: "reserved", daysAgo: 1 },
      { book: "The Pragmatic Programmer", status: "waiting" },
    ],
  },
  {
    name: "Mohammed Faizan", rollNumber: "2503A51105", batch: 2,
    loans: [
      { book: "Python Crash Course", status: "issued", daysAgo: 20, renewCount: 1 }, // renewed, due in 1 day
      { book: "Hands-On Machine Learning with Scikit-Learn, Keras and TensorFlow", status: "issued", daysAgo: 2 },
    ],
  },
  {
    name: "Sneha Patel", rollNumber: "2503A51106", batch: 2,
    loans: [
      { book: "Computer Networking: A Top-Down Approach", status: "issued", daysAgo: 16 }, // 2 days overdue
      { book: "The Alchemist", status: "returned", daysAgo: 25, returnedDaysAgo: 15 },
    ],
  },
  {
    name: "Karthik Iyer", rollNumber: "2503A51107", batch: 3,
    loans: [
      { book: "The Pragmatic Programmer", status: "issued", daysAgo: 9 },
      { book: "Deep Work", status: "reserved", daysAgo: 0 },
      { book: "Zero to One", status: "returned", daysAgo: 35, returnedDaysAgo: 17 }, // fine not paid yet
    ],
  },
  {
    name: "Diya Kapoor", rollNumber: "2503A51108", batch: 3,
    loans: [
      { book: "Higher Engineering Mathematics", status: "issued", daysAgo: 4 },
      { book: "The Pragmatic Programmer", status: "waiting" },
    ],
  },
  {
    name: "Arjun Mehta", rollNumber: "2503A51109", batch: 3,
    loans: [
      { book: "Artificial Intelligence: A Modern Approach", status: "issued", daysAgo: 11 },
      { book: "Think and Grow Rich", status: "issued", daysAgo: 22 }, // 8 days overdue
    ],
  },
  {
    name: "Fatima Khan", rollNumber: "2503A51110", batch: 4,
    loans: [
      { book: "Discrete Mathematics and Its Applications", status: "reserved", daysAgo: 1 },
      { book: "Wings of Fire", status: "returned", daysAgo: 20, returnedDaysAgo: 9 },
    ],
  },
  {
    name: "Vikram Singh", rollNumber: "2503A51111", batch: 4,
    loans: [
      { book: "Digital Design", status: "issued", daysAgo: 7 },
      { book: "The Psychology of Money", status: "issued", daysAgo: 12 }, // due in 2 days
    ],
  },
  {
    name: "Meera Joshi", rollNumber: "2503A51112", batch: 4,
    loans: [
      { book: "How to Win Friends and Influence People", status: "issued", daysAgo: 1 },
      { book: "Sapiens: A Brief History of Humankind", status: "returned", daysAgo: 28, returnedDaysAgo: 16 },
    ],
  },
];

module.exports = { DEMO_PASSWORD, students };
