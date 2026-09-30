document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("copyright-year");
  if (year) year.textContent = new Date().getFullYear();
});
