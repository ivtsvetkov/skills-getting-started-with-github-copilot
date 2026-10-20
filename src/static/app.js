document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      const placeholderOption = activitySelect.options[0].cloneNode(true);
      activitySelect.replaceChildren(placeholderOption);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, details.schedule);
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        const availabilityCount = document.createElement("span");
        availabilityCount.textContent = `${spotsLeft} spots left`;
        availability.append(availabilityLabel, availabilityCount);
        activityCard.appendChild(availability);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";
        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        details.participants.forEach((participant) => {
          const participantItem = document.createElement("li");
          const participantEmail = document.createElement("span");
          participantEmail.textContent = participant;
          participantItem.appendChild(participantEmail);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant-button";
          removeButton.setAttribute("aria-label", `Remove ${participant} from ${name}`);
          removeButton.title = `Remove ${participant}`;

          const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          deleteIcon.setAttribute("viewBox", "0 0 24 24");
          deleteIcon.setAttribute("aria-hidden", "true");
          deleteIcon.setAttribute("focusable", "false");
          const deletePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          deletePath.setAttribute("d", "M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3");
          deletePath.setAttribute("fill", "none");
          deletePath.setAttribute("stroke", "currentColor");
          deletePath.setAttribute("stroke-linecap", "round");
          deletePath.setAttribute("stroke-linejoin", "round");
          deletePath.setAttribute("stroke-width", "1.8");
          deleteIcon.appendChild(deletePath);
          removeButton.appendChild(deleteIcon);

          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Could not remove participant");
              }

              participantItem.remove();
              availabilityCount.textContent = `${details.max_participants - participantsList.children.length} spots left`;
              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              messageDiv.classList.remove("hidden");
            } catch (error) {
              messageDiv.textContent = error.message || "Failed to remove participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            } finally {
              removeButton.disabled = false;
              setTimeout(() => messageDiv.classList.add("hidden"), 5000);
            }
          });

          participantItem.appendChild(removeButton);
          participantsList.appendChild(participantItem);
        });
        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
