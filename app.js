const ChatLogic = (() => {
    let conversationId = Date.now().toString();
    let messages = [];

    const sendMessage = async (userMessage, onReply, onError, onDone) => {
      if (!userMessage.trim()) return;

      messages.push({ sender: 'user', text: userMessage });
      if (onReply) onReply({ sender: 'user', text: userMessage });

      try {
        const response = await fetch('http://localhost:8000/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            conversation_id: conversationId
          }),
        });

        if (!response.ok) throw new Error('API error');
        const data = await response.json();

        messages.push({ sender: 'ai', text: data.response });
        if (onReply) onReply({ sender: 'ai', text: data.response });
      } catch (err) {
        if (onError) onError(err);
        console.error('Chat error:', err);
      } finally {
        if (onDone) onDone();
      }
    };

    return { sendMessage };
  })();

  // Chatbox class UI logic
  class Chatbox {
    constructor() {
      this.args = {
        openButton: document.querySelector('.chatbox__button'),
        closeButton: document.querySelector('.chatbox__close--header'),
        chatBox: document.querySelector('.chatbox__support'),
        sendButton: document.querySelector('.send__button'),
        inputField: document.querySelector('.chatbox__footer input'),
        messagesContainer: document.querySelector('.chatbox__messages'),
        chatbox: document.querySelector('.chatbox__support'),
      };

      this.chatBoxVisible = false;
      this.messages = [];
      this._init();
    }

    _init() {
      this.args.openButton.addEventListener('click', () => this.toggleChat());
      this.args.closeButton.addEventListener('click', () => this.toggleChat());
      this.args.sendButton.addEventListener('click', () => this.onSend());
      this.args.inputField.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.onSend();
      });
    }

    toggleChat() {
      this.chatBoxVisible = !this.chatBoxVisible;
      this.args.chatBox.classList.toggle('chatbox--active', this.chatBoxVisible);
    }

    addMessage(messageObj) {
      this.messages.push(messageObj);
      this.updateChatDisplay();
    }
    display() {
        const {openButton, closeButton, chatBox, sendButton} = this.args;

        openButton.addEventListener('click', () => this.toggleState(chatBox));
        closeButton.addEventListener('click', () => this.toggleState(chatBox)); // Added event listener for close button

        sendButton.addEventListener('click', () => this.onSendButton(chatBox));

        const node = chatBox.querySelector('input');
        node.addEventListener("keyup", ({key}) => {
            if (key === "Enter") {
                this.onSendButton(chatBox);
            }
        });
    }

    toggleState(chatbox) {
        this.state = !this.state;

        // show or hides the box
        if(this.state) {
            chatbox.classList.add('chatbox--active');
        } else {
            chatbox.classList.remove('chatbox--active');
        }
    }

    updateChatDisplay() {
      const container = this.args.messagesContainer;
      let html = '';
      this.messages.slice().reverse().forEach(function(item) {
        if (item.sender === "user") {
          html += '<div class="messages__item messages__item--operator">' + item.text + '</div>';
        } else {
          html += '<div class="messages__item messages__item--visitor">' + item.text + '</div>';
        }
      });
      container.innerHTML = html;
      container.scrollTop = container.scrollHeight;
    }

    onSend() {
      const input = this.args.inputField;
      const userText = input.value;

      ChatLogic.sendMessage(
        userText,
        (msg) => this.addMessage(msg),
        (err) => alert('AI Unavailable: ' + err.message),
        () => { input.value = ''; }
      );
    }
  }

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    new Chatbox();
  });
