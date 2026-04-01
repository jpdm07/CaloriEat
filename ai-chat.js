/**
 * CaloriEat Assistant: optional remote AI via CALORIEAT_AI_CHAT_URL (your backend),
 * otherwise helpful CaloriEat FAQ-style replies. Never put API keys in this file.
 */
(function () {
  var ENDPOINT =
    (typeof window.CALORIEAT_AI_CHAT_URL === 'string' && window.CALORIEAT_AI_CHAT_URL) ||
    '';

  var KB = [
    {
      keys: ['start', 'begin', 'new', 'guest', 'account', 'sign up', 'signup'],
      text:
        'To try CaloriEat without an account, open the app and choose **Continue as guest**. To keep a named profile, use **Create an account** on the sign-in screen. Your data is stored in this browser unless you clear site data.',
    },
    {
      keys: ['data', 'privacy', 'where', 'stored', 'local', 'delete', 'clear'],
      text:
        'Meals, goals, and profile data are saved in your browser (localStorage) in this version—there is no cloud sync here. To remove everything, clear site data for this page in your browser settings. See the **Privacy** page for details.',
    },
    {
      keys: ['log', 'food', 'meal', 'add', 'search', 'calorie'],
      text:
        'Use **Log Food** to search the food list, pick a meal type (breakfast, lunch, dinner, snack), adjust portions if needed, and save. You can pick past dates for catch-up logging.',
    },
    {
      keys: ['goal', 'macro', 'target', 'protein', 'carb', 'fat', 'calories'],
      text:
        'Open **Goals** to set daily calories and macro targets. Those numbers power the rings and charts on your **Tracker** dashboard.',
    },
    {
      keys: ['weight', 'weigh', 'scale', 'trend'],
      text:
        'Use **Weight** to add entries; trends show on the dashboard chart. Weighing at a consistent time of day usually gives smoother trends.',
    },
    {
      keys: ['help', 'support', 'contact', 'bug', 'broken'],
      text:
        'For longer guides, open **Help Center** from the top links or menu. The **FAQs** page (faq.html) covers devices, exports, and edge cases without repeating the in-app guide. You can also use the **Contact** page to share feedback.',
    },
    {
      keys: ['faq', 'faqs', 'questions', 'common questions'],
      text:
        'Open **faq.html** on the site for FAQs—multi-device use, exports, passwords, presets, Quick Log vs Log Food, dashboard chart rows, and the AI button. It is written to complement **Help** and the in-app **Help Center**, not duplicate them.',
    },
    {
      keys: ['medical', 'doctor', 'diet', 'diagnosis', 'cure', 'treat'],
      text:
        'CaloriEat is a self-tracking tool, not medical advice. For health conditions or diet changes, talk to a qualified professional.',
    },
  ];

  function scoreReply(q) {
    var s = (q || '').toLowerCase();
    if (!s.trim()) {
      return "Hi! I'm the CaloriEat Assistant. Ask how to log food, set goals, where data is stored, or use the links in the menu for Help and Contact.";
    }
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var item = KB[i];
      var score = 0;
      for (var k = 0; k < item.keys.length; k++) {
        if (s.indexOf(item.keys[k]) !== -1) score += 2;
      }
      if (score > bestScore) {
        bestScore = score;
        best = item.text;
      }
    }
    if (best && bestScore >= 2) return best;
    if (bestScore === 0) {
      return (
        "I match simple questions about CaloriEat (logging food, goals, weight, privacy). Try rephrasing, or open **Help Center** and **Contact** from the top of the site. If your team added an AI backend, set `CALORIEAT_AI_CHAT_URL` to your server endpoint."
      );
    }
    return best;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBold(text) {
    var safe = escapeHtml(text);
    return safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function appendMessage(container, role, html) {
    var div = document.createElement('div');
    div.className = 'ai-chat-msg ai-chat-msg--' + (role === 'user' ? 'user' : 'bot');
    div.innerHTML = html;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  async function fetchRemoteReply(messages) {
    if (!ENDPOINT) return null;
    var res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages }),
    });
    if (!res.ok) throw new Error('Chat request failed');
    var data = await res.json();
    if (typeof data.reply === 'string') return data.reply;
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content || '';
    }
    if (typeof data.text === 'string') return data.text;
    return null;
  }

  function mount() {
    if (document.getElementById('aiChatRoot')) return;

    var root = document.createElement('div');
    root.id = 'aiChatRoot';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-chat-toggle';
    btn.setAttribute('aria-label', 'Open CaloriEat Assistant chat');
    btn.textContent = 'AI';

    var panel = document.createElement('div');
    panel.className = 'ai-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'CaloriEat Assistant');

    panel.innerHTML =
      '<div class="ai-chat-panel__head">' +
      '<span>CaloriEat Assistant</span>' +
      '<button type="button" class="ai-chat-panel__close" aria-label="Close chat">×</button>' +
      '</div>' +
      '<div class="ai-chat-panel__body" id="aiChatBody">' +
      '<p class="ai-chat-panel__hint">Answers are informational, not medical advice. ' +
      (ENDPOINT ? 'Connected to your configured assistant endpoint.' : 'Using built-in CaloriEat tips unless you add a backend URL.') +
      '</p>' +
      '</div>' +
      '<form class="ai-chat-panel__form" id="aiChatForm">' +
      '<input class="ai-chat-panel__input" type="text" id="aiChatInput" autocomplete="off" placeholder="Ask about logging food, goals…" />' +
      '<button type="submit" class="ai-chat-panel__send">Send</button>' +
      '</form>';

    root.appendChild(btn);
    root.appendChild(panel);
    document.body.appendChild(root);

    var bodyEl = panel.querySelector('#aiChatBody');
    var form = panel.querySelector('#aiChatForm');
    var input = panel.querySelector('#aiChatInput');
    var closeBtn = panel.querySelector('.ai-chat-panel__close');

    var remoteHistory = [];

    appendMessage(
      bodyEl,
      'bot',
      formatBold(
        'Ask anything about using CaloriEat. For example: “How do I log food?” or “Where is my data stored?”'
      )
    );

    function openPanel(open) {
      panel.classList.toggle('is-open', open);
      btn.hidden = open;
      if (open) input.focus();
    }

    btn.addEventListener('click', function () {
      openPanel(true);
    });
    closeBtn.addEventListener('click', function () {
      openPanel(false);
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var text = (input.value || '').trim();
      if (!text) return;
      input.value = '';
      appendMessage(bodyEl, 'user', escapeHtml(text));

      try {
        if (ENDPOINT) {
          remoteHistory.push({ role: 'user', content: text });
          var remote = await fetchRemoteReply(remoteHistory);
          if (remote) {
            remoteHistory.push({ role: 'assistant', content: remote });
            appendMessage(bodyEl, 'bot', formatBold(remote));
            return;
          }
          remoteHistory.pop();
        }
        var local = scoreReply(text);
        appendMessage(bodyEl, 'bot', formatBold(local));
      } catch (err) {
        appendMessage(
          bodyEl,
          'bot',
          escapeHtml("I couldn't reach the assistant server. You can still use Help Center, or try again later.")
        );
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
