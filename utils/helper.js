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
