(() => {
  const form = document.getElementById("waitlistForm");
  const emailInput = document.getElementById("email");
  const formNote = document.getElementById("formNote");
  const statusText = document.getElementById("statusText");
  const submitButton = form?.querySelector('button[type="submit"]');

  const statuses = [
    "Signal rising",
    "Reveal charging",
    "Hype building",
    "Launch warming up",
  ];

  let statusIndex = 0;

  function rotateStatus() {
    if (!statusText) return;
    statusIndex = (statusIndex + 1) % statuses.length;
    statusText.textContent = statuses[statusIndex];
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", href);
    });
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value.trim();
    if (!emailInput?.checkValidity() || !email) {
      formNote.textContent = "Please enter a valid email address first.";
      return;
    }

    if (!form.action || !form.action.includes("formspree.io/f/")) {
      formNote.textContent = "The waitlist form is not configured correctly yet.";
      return;
    }

    submitButton?.setAttribute("disabled", "disabled");
    formNote.textContent = "Joining the waitlist...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      form.reset();
      formNote.textContent = "You're on the list. We’ll reach out when the reveal is ready.";
    } catch {
      formNote.textContent = "Something went wrong. Please try again in a moment.";
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });

  window.setInterval(rotateStatus, 2400);
})();
