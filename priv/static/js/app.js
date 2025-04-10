// Initialize Socket connection on form submission, not on page load
let socket = null;

// DOM Elements
let loginInterface, chatInterface, usernameForm, usernameInput, usernameError,
    messageInput, sendButton, messagesContainer, onlineUsersList, typingIndicator;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM elements after the document is loaded
  loginInterface = document.getElementById("login-interface");
  chatInterface = document.getElementById("chat-interface");
  usernameForm = document.getElementById("username-form");
  usernameInput = document.getElementById("username-input");
  usernameError = document.getElementById("username-error");
  messageInput = document.getElementById("message-input");
  sendButton = document.getElementById("send-button");
  messagesContainer = document.getElementById("messages");
  onlineUsersList = document.getElementById("online-users");
  typingIndicator = document.getElementById("typing-indicator");
  
  // Only set up event handlers if we have the needed elements
  if (usernameForm) {
    // Add input validation for username
    usernameInput.addEventListener("input", validateUsername);
  

// Chat state variables
let currentUser = null;
let channel = null;
let presences = {};
let typingTimeout;

// Join the chat room when username is submitted
usernameForm.addEventListener("submit", event => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  
  // Validate username before attempting to connect
  if (username && validateUsername()) {
    currentUser = username;
    
    // Initialize the socket with the username param
    socket = new Phoenix.Socket("/socket", {
      params: { username: username }
    });
    
    // Add connection error handling
    socket.onError(() => {
      usernameError.textContent = "Connection failed. Please try again.";
      usernameInput.classList.add("error");
    });
    
    socket.connect();
    
    // Join the "room:lobby" channel
    channel = socket.channel("room:lobby", { username: username });
    
    // Handle successful join
    channel.join()
      .receive("ok", response => {
        console.log("Joined successfully", response);
        showChatInterface();
        
        // Load existing messages
        response.messages.forEach(msg => {
          addMessageToUI(msg);
        });
      })
      .receive("error", response => {
        console.log("Unable to join", response);
        alert("Failed to join the chat. Please try again.");
      });
    
    // Handle incoming messages
    channel.on("new_msg", payload => {
      addMessageToUI(payload);
    });
    
    // Handle presence updates
    channel.on("presence_state", state => {
      presences = Phoenix.Presence.syncState(presences, state);
      renderOnlineUsers();
    });
    
    channel.on("presence_diff", diff => {
      presences = Phoenix.Presence.syncDiff(presences, diff);
      renderOnlineUsers();
    });
    
    // Handle typing indicators
    channel.on("user_typing", payload => {
      showTypingIndicator(payload.username);
    });
    
    // Set up message sending
    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", event => {
      if (event.key === "Enter") {
        sendMessage();
      } else {
        // Send typing indicator (debounced)
        sendTypingIndicator();
      }
    });
  }
});

// Send a message to the server
function sendMessage() {
  const content = messageInput.value.trim();
  if (content) {
    channel.push("new_msg", { content: content });
    messageInput.value = "";
  }
}

// Add a message to the UI
function addMessageToUI(payload) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  
  // Check if the message is from the current user or someone else
  if (payload.username === currentUser) {
    messageElement.classList.add("outgoing");
  } else {
    messageElement.classList.add("incoming");
  }
  
  const usernameElement = document.createElement("div");
  usernameElement.classList.add("username");
  usernameElement.textContent = payload.username;
  
  const contentElement = document.createElement("div");
  contentElement.classList.add("content");
  contentElement.textContent = payload.content;
  
  const timeElement = document.createElement("div");
  timeElement.classList.add("time");
  timeElement.textContent = formatTimestamp(payload.timestamp);
  
  messageElement.appendChild(usernameElement);
  messageElement.appendChild(contentElement);
  messageElement.appendChild(timeElement);
  
  messagesContainer.appendChild(messageElement);
  
  // Scroll to the bottom of the messages container
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Remove typing indicator if present
  removeTypingIndicator(payload.username);
}

// Format timestamp to a readable format
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Show the chat interface and hide the login interface
function showChatInterface() {
  loginInterface.style.display = "none";
  chatInterface.style.display = "flex";
}

// Render the list of online users
function renderOnlineUsers() {
  onlineUsersList.innerHTML = "";
  
  Object.entries(presences).forEach(([username, presence]) => {
    const userElement = document.createElement("li");
    userElement.textContent = username;
    onlineUsersList.appendChild(userElement);
  });
}

// Username validation
function validateUsername() {
  const username = usernameInput.value.trim();
  let errorMessage = "";
  
  if (username.length < 3) {
    errorMessage = "Username must be at least 3 characters long";
  } else if (username.length > 20) {
    errorMessage = "Username must be less than 20 characters long";
  }
  
  if (usernameError) {
    usernameError.textContent = errorMessage;
    
    // Add visual indication
    if (errorMessage) {
      usernameInput.classList.add("error");
      return false;
    } else {
      usernameInput.classList.remove("error");
      return true;
    }
  }
  
  return username.length >= 3 && username.length <= 20;
}

// Debounce function for typing indicator
function sendTypingIndicator() {
  clearTimeout(typingTimeout);
  
  channel.push("user_typing", { username: currentUser });
  
  typingTimeout = setTimeout(() => {
    // Stop sending typing indicator after a delay
  }, 1000);
}

// Show typing indicator in the UI
function showTypingIndicator(username) {
  // Don't show indicator for current user
  if (username === currentUser) return;
  
  // Check if indicator already exists
  let indicator = document.getElementById(`typing-${username}`);
  
  if (!indicator) {
    // Create a new indicator element with animation
    indicator = document.createElement("div");
    indicator.id = `typing-${username}`;
    indicator.classList.add("typing-indicator");
    
    // Create the typing animation dots
    const dotContainer = document.createElement("span");
    dotContainer.innerHTML = `<strong>${username}</strong> is typing<span class="dots"><span>.</span><span>.</span><span>.</span></span>`;
    
    indicator.appendChild(dotContainer);
    messagesContainer.appendChild(indicator);
    
    // Make sure indicators are visible at the bottom of the chat
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Auto-remove after a delay
    setTimeout(() => {
      removeTypingIndicator(username);
    }, 3000);
  } else {
    // Reset the timeout if indicator already exists
    clearTimeout(indicator.timeout);
    indicator.timeout = setTimeout(() => {
      removeTypingIndicator(username);
    }, 3000);
  }
}

// Remove typing indicator from the UI
function removeTypingIndicator(username) {
  const indicator = document.getElementById(`typing-${username}`);
  if (indicator) {
    // Add fade-out animation
    indicator.classList.add("fade-out");
    
    // Remove after animation completes
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 300);
  }
}
  } // End of if(usernameForm)
}); // End of DOMContentLoaded