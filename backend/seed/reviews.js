// Demo ratings and reviews.
// A student can only review a book they returned, so the seed also adds an
// old "returned" loan for each of these (if the student does not have one).
//   daysAgo = when the book was issued (it was returned 10 days later)
module.exports = [
  { roll: "2503A51101", book: "Clean Code", stars: 5, comment: "Changed how I write code. Short chapters, easy to follow.", daysAgo: 30 },
  { roll: "2503A51101", book: "Introduction to Algorithms", stars: 4, comment: "Heavy but the best book for DSA theory. Use it with lecture notes.", daysAgo: 70 },
  { roll: "2503A51102", book: "Atomic Habits", stars: 5, comment: "Simple ideas that actually work. Finished it in a week.", daysAgo: 45 },
  { roll: "2503A51102", book: "Python Crash Course", stars: 5, comment: "Perfect first Python book. The projects at the end are fun.", daysAgo: 60 },
  { roll: "2503A51103", book: "Let Us C", stars: 4, comment: "Good for C basics and lab programs.", daysAgo: 40 },
  { roll: "2503A51103", book: "Operating System Concepts", stars: 4, comment: "Clear diagrams. Very helpful before the mid exam.", daysAgo: 55 },
  { roll: "2503A51104", book: "Wings of Fire", stars: 5, comment: "Very inspiring story of Dr. Kalam. Must read for every student.", daysAgo: 50 },
  { roll: "2503A51104", book: "Database System Concepts", stars: 3, comment: "Covers everything, but some chapters are long and dry.", daysAgo: 65 },
  { roll: "2503A51105", book: "Head First Java", stars: 5, comment: "Fun pictures and puzzles make Java easy to understand.", daysAgo: 48 },
  { roll: "2503A51105", book: "Atomic Habits", stars: 4, comment: "Useful tips. A little repetitive in the middle.", daysAgo: 75 },
  { roll: "2503A51106", book: "The Alchemist", stars: 5, comment: "Short and beautiful. Read it in two days.", daysAgo: 25 },
  { roll: "2503A51106", book: "Ikigai", stars: 4, comment: "Calm and simple book about finding purpose.", daysAgo: 58 },
  { roll: "2503A51107", book: "Zero to One", stars: 4, comment: "Good for anyone interested in startups.", daysAgo: 35 },
  { roll: "2503A51107", book: "The Psychology of Money", stars: 5, comment: "Easy stories that teach a lot about saving money.", daysAgo: 62 },
  { roll: "2503A51108", book: "Learning React", stars: 4, comment: "Helped me build my first React project.", daysAgo: 44 },
  { roll: "2503A51109", book: "Higher Engineering Mathematics", stars: 4, comment: "Lots of solved examples. Good for exam practice.", daysAgo: 52 },
  { roll: "2503A51110", book: "Rich Dad Poor Dad", stars: 3, comment: "Interesting ideas, but some advice is too general.", daysAgo: 66 },
  { roll: "2503A51111", book: "Computer Networking: A Top-Down Approach", stars: 5, comment: "The best networking book. Top-down order makes sense.", daysAgo: 57 },
  { roll: "2503A51112", book: "Sapiens: A Brief History of Humankind", stars: 5, comment: "Makes you think about history in a new way.", daysAgo: 68 },
  { roll: "2503A51112", book: "Clean Code", stars: 4, comment: "Good habits for writing neat code. Examples are in Java.", daysAgo: 80 },
];
