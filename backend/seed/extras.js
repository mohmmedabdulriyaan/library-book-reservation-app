// Demo data for the extra features: announcements, book requests,
// wishlists, digital library PDFs and borrowing limits.
module.exports = {
  announcements: [
    { title: "Library closed on Monday", message: "The library will stay closed on Monday for stock checking. Book returns can be dropped in the return box.", important: true },
    { title: "18 new books arrived", message: "New titles like The Psychology of Money, Deep Work and Ikigai are now on the shelf. Reserve them from the app.", important: false },
    { title: "Exam week timings", message: "During exam week the library is open from 8 AM to 10 PM. Please keep your phone on silent.", important: false },
  ],

  // votes = roll numbers of students who want the book (first one asked for it)
  requests: [
    { title: "Cracking the Coding Interview", author: "Gayle Laakmann McDowell", reason: "Very useful for placement preparation.", votes: ["2503A51101", "2503A51103", "2503A51107", "2503A51109"], status: "approved", adminNote: "Ordered 3 copies, arriving next week." },
    { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", reason: "Needed for the DBMS project.", votes: ["2503A51105", "2503A51111"], status: "pending" },
    { title: "The Lean Startup", author: "Eric Ries", reason: "For the entrepreneurship club.", votes: ["2503A51104", "2503A51106", "2503A51112"], status: "pending" },
    { title: "Harry Potter and the Philosopher's Stone", author: "J. K. Rowling", reason: "Something fun to read between exams.", votes: ["2503A51108"], status: "rejected", adminNote: "Not in this year's budget, maybe next term." },
  ],

  // roll number -> titles saved in the wishlist
  wishlists: {
    "2503A51101": ["Deep Work", "Zero to One", "The Intelligent Investor"],
    "2503A51102": ["Ikigai", "Man's Search for Meaning"],
    "2503A51104": ["The Almanack of Naval Ravikant", "Think and Grow Rich"],
    "2503A51107": ["Clean Code", "Node.js Design Patterns"],
  },

  // Sample PDFs for the digital library
  resources: [
    { title: "Data Structures - Unit 1 Notes", type: "notes", subject: "Data Structures", description: "Arrays, linked lists, stacks and queues.", lines: ["Unit 1: Linear Data Structures", "", "1. Arrays - fixed size, index access in O(1)", "2. Linked lists - nodes joined by pointers", "3. Stack - Last In First Out (push, pop)", "4. Queue - First In First Out (enqueue, dequeue)", "", "Practice: reverse a linked list, balance brackets with a stack."] },
    { title: "Operating Systems - Process Scheduling", type: "notes", subject: "Operating Systems", description: "FCFS, SJF, Round Robin with examples.", lines: ["Process Scheduling", "", "FCFS - First Come First Served", "SJF - Shortest Job First", "Round Robin - each process gets a time slice", "Priority Scheduling - highest priority runs first", "", "Formula: Turnaround time = Completion time - Arrival time", "Waiting time = Turnaround time - Burst time"] },
    { title: "DBMS Mid-Term Question Paper", type: "question_paper", subject: "DBMS", year: 2025, description: "Mid-term exam, 2025.", lines: ["Mid-Term Examination 2025 - DBMS", "Time: 90 minutes      Max marks: 30", "", "Q1. Explain the ER model with an example. (5)", "Q2. What is normalization? Explain 1NF, 2NF and 3NF. (10)", "Q3. Write SQL queries for the given tables. (10)", "Q4. Explain ACID properties of a transaction. (5)"] },
    { title: "Mathematics End-Sem Question Paper", type: "question_paper", subject: "Mathematics", year: 2024, description: "End semester exam, 2024.", lines: ["End Semester Examination 2024 - Mathematics", "Time: 3 hours      Max marks: 60", "", "Q1. Find the eigenvalues of the given matrix. (10)", "Q2. Solve the differential equation dy/dx + y = x. (10)", "Q3. Prove that the set of rational numbers is countable. (10)", "Q4. Evaluate the given double integral. (10)"] },
    { title: "Python Quick Reference", type: "ebook", subject: "Programming", description: "Short guide to Python basics.", lines: ["Python Quick Reference", "", "print('Hello')        # show output", "x = int(input())      # read a number", "for i in range(5):    # loop 0 to 4", "def add(a, b):        # function", "    return a + b", "nums = [1, 2, 3]      # list", "info = {'name': 'Ali'} # dictionary"] },
  ],

  // Borrowing limits: final-year (batch 4) students can hold more books
  limits: { defaultLimit: 3, batchLimits: [{ batch: 4, limit: 5 }] },
};
