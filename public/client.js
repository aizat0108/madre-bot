

let globalChatId =""; // Declare a global variable to store the chat ID
function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = ''; // Clear existing messages

    if (!messages || messages.length === 0) {
        console.log('No messages to display.');
        return; // Early return if messages are undefined or empty
    }

    messages.reverse().forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = message.from_me ? 'message sent' : 'message received';

        if (message.type === 'image' && message.image) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'message-content image-message';
        
            const img = document.createElement('img');
            img.src = message.image.link || ''; // Default to empty string if link is undefined
            img.alt = 'Image';
            img.className = 'message-image';
            imageDiv.appendChild(img);
        
            const captionDiv = document.createElement('div');
            captionDiv.className = 'caption';
            captionDiv.textContent = message.image.caption || ''; // Default to empty string if caption is undefined
            imageDiv.appendChild(captionDiv);
        
            messageDiv.appendChild(imageDiv);
        } else if (message.type === 'document' && message.document) {
            const documentDiv = document.createElement('div');
            documentDiv.className = 'message-content document-message';

            // Create and append the document-related elements as before
            // No changes needed here unless you also want to check for specific properties inside message.document

            messageDiv.appendChild(documentDiv);
        } else if (message.type === 'text') {
            const textContent = message.text && message.text.body ? message.text.body : "Text content unavailable";
            const textDiv = document.createElement('div');
            textDiv.className = 'message-content';
            textDiv.textContent = textContent;
            messageDiv.appendChild(textDiv);
        } else {
            // Handle unexpected message types or missing properties more gracefully
            console.log('Unexpected message type or missing properties:', message);
        }

        // Append timeDiv and the rest of your message handling as before
        // Ensure timestamp is properly checked and formatted
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        if (message.timestamp) {
            const timestamp = new Date(message.timestamp * 1000);
            timeDiv.textContent = formatMessageTime(timestamp);
        } else {
            timeDiv.textContent = 'Unknown time';
        }
        messageDiv.appendChild(timeDiv);

        messagesContainer.appendChild(messageDiv);
    });

    // Scroll to the bottom of the messages container logic should be added here if needed
}

function formatMessageTime(timestamp) {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000); // 24 hours in milliseconds
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    // Time formatter for adding time next to the date or descriptor
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // Adjusted Date formatter for messages older than a week to exclude weekdays
    const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let formattedTime = timeFormatter.format(messageDate);

    // Check if the message was sent today
    if (messageDate.toDateString() === now.toDateString()) {
        return `Today, ${formattedTime}`;
    } 
    // Check if the message was sent yesterday
    else if (messageDate.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${formattedTime}`;
    } 
    // For messages sent more than a week ago, show the date and time without weekday
    return `${dateFormatter.format(messageDate)}, ${formattedTime}`;
}
async function fetchChats(page = 6) {
    try {
        const response = await fetch(`/api/chats?pageSize=500`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        displayChats(data);

        // Set the initial title to "Select a chat"
        const selectedChatName = document.getElementById('selectedChatName');
        selectedChatName.textContent = "Select a chat";
        // Update pagination controls here based on the response if necessary
    } catch (error) {
        console.error('Error fetching chats:', error);
    }
}
function displayChats(data) {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = ''; // Clear existing content

    data.chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-list-item');

        const displayName = chat.name || chat.id; // Use name if available; otherwise, use the user number
        // Circle beside the name
        const circleDiv = document.createElement('div');
        circleDiv.classList.add('circle');
        chatItem.appendChild(circleDiv);

        // Chat info
        const chatInfoDiv = document.createElement('div');
        chatInfoDiv.classList.add('chat-info');

        // Chat name
        const chatNameDiv = document.createElement('div');
        chatNameDiv.classList.add('chat-name');
        chatNameDiv.textContent = displayName;
        chatInfoDiv.appendChild(chatNameDiv);

           // Latest message handling with enhanced logging
           const latestMessageDiv = document.createElement('div');
           latestMessageDiv.classList.add('latest-message');
   
           // Log the last_message object to inspect its structure
    
   
           if (chat.last_message) {
               let content = getMessageContent(chat.last_message);
               latestMessageDiv.textContent = content;
           } else {
               latestMessageDiv.textContent = "No messages";
           }
        chatInfoDiv.appendChild(latestMessageDiv);

        // Chat time
        const chatTimeDiv = document.createElement('div');
        chatTimeDiv.classList.add('chat-time');
        if (chat.last_message && chat.last_message.timestamp) {
            const timestamp = new Date(chat.last_message.timestamp * 1000); // Convert timestamp to milliseconds
            chatTimeDiv.textContent = formatChatTime(timestamp);
        } else {
            chatTimeDiv.textContent = "";
        }
        chatInfoDiv.appendChild(chatTimeDiv);

        chatItem.appendChild(chatInfoDiv);

        chatItem.onclick = async () => {
            try {
                const displayName = chat.name || chat.id; // Use name if available; otherwise, use the user number
                // Update the header with the selected chat's name
                globalChatId = chat.id;
                const selectedChatName = document.getElementById('selectedChatName');
                console.log(displayName);
                selectedChatName.textContent = displayName;
                const messages = await fetchMessages(chat.id);
                
                displayMessages(messages);
                
            // Get the messages container
const messagesContainer = document.getElementById('messagesContainer');

// Scroll to the bottom of the messages container
messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        chatList.appendChild(chatItem);
    });
}

document.getElementById('prevPage').addEventListener('click', function() {
    const currentPageElement = document.getElementById('currentPage');
    let currentPage = parseInt(currentPageElement.textContent);
    if (currentPage > 1) {
        currentPage -= 1;
        fetchChats(currentPage);
        currentPageElement.textContent = currentPage.toString();
    }
});

document.getElementById('nextPage').addEventListener('click', function() {
    const currentPageElement = document.getElementById('currentPage');
    let currentPage = parseInt(currentPageElement.textContent);
    // Assuming you don't know the total number of pages, you might adjust this
    // logic based on your API response to handle when to disable or hide the "Next" button.
    currentPage += 1;
    fetchChats(currentPage);
    currentPageElement.textContent = currentPage.toString();
});
function formatChatTime(timestamp) {
    const messageDate = new Date(timestamp * 1000);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000); // 24 hours in milliseconds

    // Formatting the time in 24-hour format
    const formattedTime = messageDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // Date formatting function
    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Check if the message was sent today
    if (messageDate.toDateString() === now.toDateString()) {
        return formattedTime;
    }
    // Check if the message was sent yesterday
    else if (messageDate.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${formattedTime}`;
    }
    // For messages older than yesterday, show the date in dd/mm/yyyy format and time
    return `${formatDate(messageDate)}, ${formattedTime}`;
}

function getMessageContent(message) {
    // Handle image messages
    if (message.type === 'image' && message.image && message.image.caption) {
        return `[Image] ${message.image.caption}`;
    }
    // Handle text messages
    else if (message.type === 'text' && message.text && message.text.body) {
        return message.text.body;
    }
    // Placeholder for handling other message types...
    else {
        // Generic fallback for unhandled or unknown message types
        return "Unsupported message type or content";
    }
}
// This function fetches messages for a specific chat ID from your own server
async function fetchMessages(chatId) {
    try {
        const response = await fetch(`/api/messages/${chatId}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Assuming data.messages is an array of message objects each with a 'timestamp' property
        const sortedMessages = data.messages.sort((a, b) => b.timestamp - a.timestamp);

        return sortedMessages;
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

async function sendWhapiRequest(endpoint, params = {}, method = 'POST') {
    console.log('Menghantar permintaan ke Whapi.Cloud...');
    const options = {
        method: method,
        headers: {
            Authorization: `Bearer ${apiToken}`, // Dynamically retrieve apiToken
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    };
    const url = `/api/${endpoint}`; // Construct the URL with the provided endpoint
    try {
        const response = await fetch(url, options);
        const jsonResponse = await response.json();
        console.log('Respon Whapi:', JSON.stringify(jsonResponse, null, 2));
        return jsonResponse;
    } catch (error) {
        console.error('Ralat menghantar permintaan:', error);
        throw error;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const messageInput = document.getElementById("messageInput");
    const sendMessageButton = document.getElementById("sendMessageButton");
    const messagesContainer = document.getElementById("messagesContainer");

    sendMessageButton.addEventListener("click", async function() {
        const message = messageInput.value.trim();
        if (message !== "") {
            messageInput.value = ""; // Clear the input field
            try {
                // Send the message to the server endpoint
                const response = await fetch("/api/messages/text", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ chatId: globalChatId, message: message })
                });
                if (response.ok) {
                    // Display the received response from the server if needed
                    const responseData = await response.json();
                    // Handle the response data as needed
                    const messages = await fetchMessages(globalChatId);
                    displayMessages(messages);
                } else {
                    console.error("Failed to send message:", response.statusText);
                }
            } catch (error) {
                console.error("Error:", error.message);
            }
        }
    });
    messageInput.addEventListener("keypress", async function(event) {
        // Check if the pressed key is 'Enter'
        if (event.key === "Enter") {
            const message = messageInput.value.trim();
            if (message !== "") {
                messageInput.value = ""; // Clear the input field
                try {
                    // Send the message to the server endpoint
                    const response = await fetch("/api/messages/text", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ chatId: globalChatId, message: message })
                    });
                    if (response.ok) {
                        // Display the received response from the server if needed
                        const responseData = await response.json();
                        // Handle the response data as needed
                        const messages = await fetchMessages(globalChatId);
                        displayMessages(messages);
                    } else {
                        console.error("Failed to send message:", response.statusText);
                    }
                } catch (error) {
                    console.error("Error:", error.message);
                }
            }
        }
    });
  
});

// Function to send a message to the server
async function sendMessage() {
    try {
        // Call the sendWhapiRequest function to send the message content and chat ID to the server
        const response = await fetch('/api/messages/text');
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Message sent successfully:', response);
    } catch (error) {
        console.error('Error sending message:', error);
        throw error; // Re-throw the error to handle it in the caller function if needed
    }
}

async function callWebhook(messageContent, chatId) {
    try {
        // Construct the webhook endpoint URL
        const webhookEndpoint = "https://hook.us1.make.com/mbapp78nto1npjt6ok1jp4rjdacr8ie1";

        // Send the message content and chat ID to the webhook endpoint
        const response = await fetch(webhookEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: messageContent, chatId: chatId })
        });

        if (response.ok) {
            // Display the received response from the webhook if needed
            const responseData = await response.json();
            console.log('Webhook response:', responseData);
        } else {
            console.error("Failed to send message:", response.statusText);
        }
    } catch (error) {
        console.error("Error calling webhook:", error.message);
    }
}
// Call fetchChats on page load or based on some user actions
document.addEventListener('DOMContentLoaded', fetchChats);
