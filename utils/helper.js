exports.checkMonth = (inputDate) => {
  try {
    const submittedDate = new Date(inputDate);
    const currentDate = new Date();

    const submittedMonth = submittedDate.getMonth();
    const submittedYear = submittedDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return submittedYear === currentYear && submittedMonth === currentMonth;
  } catch (error) {
    console.log(error);
  }
};

exports.getDateWithDay = (dayVar) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // Months are 0-indexed

  // Create a new Date object using the specified day, current month, and current year
  const resultDate = new Date(currentYear, currentMonth, dayVar);

  return resultDate;
};
