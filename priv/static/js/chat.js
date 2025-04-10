// DOM elements
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const joinChatButton = document.getElementById('join-chat-button');
const chatApp = document.getElementById('chat-app');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const onlineUsers = document.getElementById('online-users');
const currentUserElement = document.getElementById('current-user');

// State
let socket = null;
let channel = null;
let username = '';

// Event listeners
joinChatButton.addEventListener('click', joinChat);
messageForm.addEventListener('submit', sendMessage);

function joinChat() {
  username = usernameInput.value.trim();
  
  if (username.length < 3) {
    alert('Username must be at least 3 characters long');
    return;
  }

  // Show the chat app and hide the username form
  usernameForm.classList.add('hidden');
  chatApp.classList.remove('hidden');
  currentUserElement.textContent = `Logged in as: ${username}`;
  
  // Connect to the WebSocket
  connectToSocket();
}

function connectToSocket() {
  // Load the Phoenix socket script
  const script = document.createElement('script');
  script.src = '/assets/phoenix.js';
  script.onload = initializeSocket;
  document.head.appendChild(script);
}

function initializeSocket() {
  // Initialize the socket with the username parameter
  socket = new window.Phoenix.Socket('/socket', {
    params: { username: username }
  });
  
  // Connect to the socket
  socket.connect();
  
  // Join the chat room channel
  channel = socket.channel('chat_room', {});
  channel.join()
    .receive('ok', resp => {
      console.log('Joined chat room successfully', resp);
    })
    .receive('error', resp => {
      console.error('Unable to join chat room', resp);
      alert('Failed to join chat room. Please try again.');
      location.reload();
    });
  
  // Listen for new messages
  channel.on('new_message', handleNewMessage);
  
  // Listen for existing messages
  channel.on('messages', messages => {
    messagesContainer.innerHTML = '';
    messages.messages.forEach(message => {
      addMessageToUI(message);
    });
    
    // Scroll to the bottom of the messages container
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
  
  // Handle presence state and changes
  channel.on('presence_state', state => {
    renderOnlineUsers(state);
  });
  
  channel.on('presence_diff', diff => {
    // We'll just re-request the full state to keep things simple
    channel.push('get_presence', {})
      .receive('ok', state => {
        renderOnlineUsers(state);
      });
  });
}

function sendMessage(event) {
  event.preventDefault();
  
  const content = messageInput.value.trim();
  if (!content) return;
  
  channel.push('new_message', { content: content })
    .receive('ok', () => {
      messageInput.value = '';
    })
    .receive('error', resp => {
      console.error('Error sending message', resp);
      alert('Failed to send message. Please try again.');
    });
}

function handleNewMessage(message) {
  addMessageToUI(message);
  
  // Scroll to the bottom of the messages container
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessageToUI(message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  
  // Add classes for own messages vs others
  if (message.username === username) {
    messageElement.classList.add('own-message');
  } else {
    messageElement.classList.add('other-message');
  }
  
  // Format the timestamp
  const timestamp = new Date(message.timestamp).toLocaleTimeString();
  
  messageElement.innerHTML = `
    <div class="message-header">
      <span class="username">${message.username}</span>
      <span class="timestamp">${timestamp}</span>
    </div>
    <div class="message-content">${escapeHtml(message.content)}</div>
  `;
  
  messagesContainer.appendChild(messageElement);
}

function renderOnlineUsers(presenceState) {
  onlineUsers.innerHTML = '';
  
  // Convert the presence state object to an array of user objects
  const users = Object.keys(presenceState).map(key => {
    const userInfo = presenceState[key].metas[0];
    return {
      username: userInfo.username,
      online_at: userInfo.online_at
    };
  });
  
  // Sort users by username for consistent display
  users.sort((a, b) => a.username.localeCompare(b.username));
  
  // Create HTML elements for each online user
  users.forEach(user => {
    const userElement = document.createElement('div');
    userElement.classList.add('user');
    
    // Highlight the current user
    if (user.username === username) {
      userElement.classList.add('current-user');
    }
    
    userElement.innerHTML = `
      <span class="user-status"></span>
      <span class="username">${user.username}</span>
    `;
    
    onlineUsers.appendChild(userElement);
  });
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
