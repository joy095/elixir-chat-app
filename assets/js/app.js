// Import Phoenix Socket and LiveView JS
import "phoenix_html";
import {Socket, Presence} from "phoenix";
import {LiveSocket} from "phoenix_live_view";
import topbar from "../vendor/topbar";

// Show progress bar on live navigation and form submits
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"});
window.addEventListener("phx:page-loading-start", info => topbar.show());
window.addEventListener("phx:page-loading-stop", info => topbar.hide());

// Connect if there are any LiveViews on the page
let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
let liveSocket = new LiveSocket("/live", Socket, {params: {_csrf_token: csrfToken}});
liveSocket.connect();

// Make liveSocket available for debugging in browser console
window.liveSocket = liveSocket;

// Chat functionality
document.addEventListener("DOMContentLoaded", () => {
  const messagesContainer = document.getElementById("messages");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const usernameForm = document.getElementById("username-form");
  const usernameInput = document.getElementById("username-input");
  const chatInterface = document.getElementById("chat-interface");
  const loginInterface = document.getElementById("login-interface");
  const onlineUsersList = document.getElementById("online-users");
  
  let channel;
  let presence;

  // Helper to format messages
  const formatMessage = (message) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    
    // Format timestamp if it exists
    const timestamp = message.timestamp 
      ? new Date(message.timestamp).toLocaleTimeString()
      : new Date().toLocaleTimeString();
    
    messageElement.innerHTML = `
      <span class="username">${message.user || 'Anonymous'}:</span>
      <span class="content">${message.content}</span>
      <span class="timestamp">${timestamp}</span>
    `;
    return messageElement;
  };

  // Helper to render online users
  const renderOnlineUsers = (users) => {
    onlineUsersList.innerHTML = "";
    
    Object.keys(users).forEach(username => {
      const userItem = document.createElement("li");
      userItem.textContent = username;
      onlineUsersList.appendChild(userItem);
    });
  };

  // Handle username submission
  usernameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    
    if (username) {
      // Connect to socket and join channel
      connectToChat(username);
      
      // Show chat interface, hide login
      loginInterface.style.display = "none";
      chatInterface.style.display = "block";
    }
  });

  // Function to connect to the chat socket
  const connectToChat = (username) => {
    const socket = new Socket("/socket", { params: { username } });
    socket.connect();
    
    channel = socket.channel("chat_room", {});
    
    // Receive messages from the server
    channel.on("messages", ({ messages }) => {
      messagesContainer.innerHTML = "";
      messages.forEach(message => {
        messagesContainer.appendChild(formatMessage(message));
      });
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
    
    // Handle presence state
    channel.on("presence_state", (state) => {
      renderOnlineUsers(state);
    });
    
    // Handle new messages
    channel.on("new_message", (message) => {
      messagesContainer.appendChild(formatMessage(message));
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
    
    // Handle user typing status
    channel.on("user_typing", ({ user, typing }) => {
      const typingIndicator = document.getElementById("typing-indicator");
      if (typing) {
        if (!typingIndicator) {
          const indicator = document.createElement("div");
          indicator.id = "typing-indicator";
          indicator.textContent = `${user} is typing...`;
          indicator.classList.add("typing-indicator");
          messagesContainer.parentNode.insertBefore(indicator, messageInput.parentNode);
        }
      } else if (typingIndicator) {
        typingIndicator.remove();
      }
    });
    
    // Join the channel
    channel.join()
      .receive("ok", resp => {
        console.log("Joined chat room successfully", resp);
      })
      .receive("error", resp => {
        console.error("Unable to join chat room", resp);
      });
    
    // Handle send button
    sendButton.addEventListener("click", sendMessage);
    
    // Handle Enter key in message input
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
        e.preventDefault();
      } else {
        // Send typing indicator (throttled)
        if (!messageInput.dataset.typing) {
          channel.push("typing", { typing: true });
          messageInput.dataset.typing = "true";
          
          // Reset typing after 2 seconds of inactivity
          setTimeout(() => {
            messageInput.dataset.typing = "";
            channel.push("typing", { typing: false });
          }, 2000);
        }
      }
    });
  };
  
  // Function to send a message
  const sendMessage = () => {
    const content = messageInput.value.trim();
    
    if (content) {
      channel.push("new_message", { content })
        .receive("error", (err) => {
          console.error("Error sending message", err);
        });
      
      messageInput.value = "";
      // Clear typing indicator
      channel.push("typing", { typing: false });
    }
  };
});

// Export the Phoenix Socket constructor for use in other files if needed
window.Phoenix = {Socket, Presence};
