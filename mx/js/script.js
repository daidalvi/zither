"use strict";

window.AllowBackFromHistory = false;
function CheckLocation() {
    var start = "#go_to_message";
    var hash = location.hash;
    if (hash.substr(0, start.length) == start) {
        var messageId = parseInt(hash.substr(start.length));
        if (messageId) {
            GoToMessage(messageId);
        }
    } else if (hash == "#allow_back") {
        window.AllowBackFromHistory = true;
    }
}

function ShowToast(text) {
    var container = document.createElement("div");
    container.className = "toast_container";
    var inner = container.appendChild(document.createElement("div"));
    inner.className = "toast_body";
    inner.appendChild(document.createTextNode(text));
    var appended = document.body.appendChild(container);
    setTimeout(function () {
        AddClass(appended, "toast_shown");
        setTimeout(function () {
            RemoveClass(appended, "toast_shown");
            setTimeout(function () {
                document.body.removeChild(appended);
            }, 3000);
        }, 3000);
    }, 0);
}

function ShowHashtag(tag) {
    ShowToast("This is a hashtag '#" + tag + "' link.");
    return false;
}

function ShowCashtag(tag) {
    ShowToast("This is a cashtag '$" + tag + "' link.");
    return false;
}

function ShowBotCommand(command) {
    ShowToast("This is a bot command '/" + command + "' link.");
    return false;
}

function ShowMentionName() {
    ShowToast("This is a link to a user mentioned by name.");
    return false;
}

function ShowNotLoadedEmoji() {
    ShowToast("This custom emoji is not included, change data exporting settings to download.");
    return false;
}

function ShowNotAvailableEmoji() {
    ShowToast("This custom emoji is not available.");
    return false;
}

function ShowTextCopied(content) {
    navigator.clipboard.writeText(content);
    ShowToast("Text copied to clipboard.");
    return false;
}

function ShowSpoiler(target) {
    if (target.classList.contains("hidden")) {
        target.classList.toggle("hidden");
    }
}

function AddClass(element, name) {
    var current = element.className;
    var expression = new RegExp('(^|\\s)' + name + '(\\s|$)', 'g');
    if (expression.test(current)) {
        return;
    }
    element.className = current + ' ' + name;
}

function RemoveClass(element, name) {
    var current = element.className;
    var expression = new RegExp('(^|\\s)' + name + '(\\s|$)', '');
    var match = expression.exec(current);
    while ((match = expression.exec(current)) != null) {
        if (match[1].length > 0 && match[2].length > 0) {
            current = current.substr(0, match.index + match[1].length)
                + current.substr(match.index + match[0].length);
        } else {
            current = current.substr(0, match.index)
                + current.substr(match.index + match[0].length);
        }
    }
    element.className = current;
}

function EaseOutQuad(t) {
    return t * t;
}

function EaseInOutQuad(t) {
    return (t < 0.5) ? (2 * t * t) : ((4 - 2 * t) * t - 1);
}

function ScrollHeight() {
    if ("innerHeight" in window) {
        return window.innerHeight;
    } else if (document.documentElement) {
        return document.documentElement.clientHeight;
    }
    return document.body.clientHeight;
}

function ScrollTo(top, callback) {
    var html = document.documentElement;
    var current = html.scrollTop;
    var delta = top - current;
    var finish = function () {
        html.scrollTop = top;
        if (callback) {
            callback();
        }
    };
    if (!window.performance.now || delta == 0) {
        finish();
        return;
    }
    var transition = EaseOutQuad;
    var max = 300;
    if (delta < -max) {
        current = top + max;
        delta = -max;
    } else if (delta > max) {
        current = top - max;
        delta = max;
    } else {
        transition = EaseInOutQuad;
    }
    var duration = 150;
    var interval = 7;
    var time = window.performance.now();
    var animate = function () {
        var now = window.performance.now();
        if (now >= time + duration) {
            finish();
            return;
        }
        var dt = (now - time) / duration;
        html.scrollTop = Math.round(current + delta * transition(dt));
        setTimeout(animate, interval);
    };
    setTimeout(animate, interval);
}

function ScrollToElement(element, callback) {
    var header = document.getElementsByClassName("page_header")[0];
    var headerHeight = header ? header.offsetHeight : 0;
    var nav = document.querySelector('.topic-navigation');
    var navHeight = nav ? nav.offsetHeight : 0;
    var html = document.documentElement;
    var scrollHeight = ScrollHeight();
    var available = scrollHeight - headerHeight - navHeight;
    var padding = 10;
    var top = element.offsetTop;
    var height = element.offsetHeight;
    var desired = top
        - Math.max((available - height) / 2, padding)
        - headerHeight - navHeight;
    var scrollTopMax = html.offsetHeight - scrollHeight;
    ScrollTo(Math.min(desired, scrollTopMax), callback);
}

function GoToMessage(messageId) {
    var element = document.getElementById("message" + messageId);
    if (element) {
        // Если это якорь внутри альбома — прокручиваем к сообщению-контейнеру
        let scrollTarget = element;
        if (element.classList.contains('album-anchor')) {
            const parentMsg = element.closest('.message');
            if (parentMsg) scrollTarget = parentMsg;
        }

        var hash = "#go_to_message" + messageId;
        if (location.hash != hash) {
            location.hash = hash;
        }
        ScrollToElement(scrollTarget, function () {
            AddClass(scrollTarget, "selected");
            setTimeout(function () {
                RemoveClass(scrollTarget, "selected");
            }, 1000);
        });
    } else {
        ShowToast("This message was not exported. Maybe it was deleted.");
    }
    return false;
}

function GoBack(anchor) {
    if (!window.AllowBackFromHistory) {
        return true;
    }
    history.back();
    if (!anchor || !anchor.getAttribute) {
        return true;
    }
    var destination = anchor.getAttribute("href");
    if (!destination) {
        return true;
    }
    setTimeout(function () {
        location.href = destination;
    }, 100);
    return false;
}

// ===================================================================
// == ГЛОБАЛЬНОЕ СОСТОЯНИЕ ==
// ===================================================================
let topics = {};
let allMessages = [];
let lightboxItems = [];

document.addEventListener('DOMContentLoaded', function() {
    removeOversizedVideos();
    groupAlbums();
    initTopicTabs();
    initLightbox();
    collectAllMediaForLightbox();
    initThemeSwitcher();
});

// ===================================================================
// == УДАЛЕНИЕ ВИДЕО "EXCEEDS MAXIMUM SIZE" ==
// ===================================================================
function removeOversizedVideos() {
    // Находим все блоки media_video с текстом "Exceeds maximum size"
    const oversizedVideos = document.querySelectorAll('.media_video');
    oversizedVideos.forEach(block => {
        const description = block.querySelector('.description');
        if (description && description.textContent.includes('Exceeds maximum size')) {
            // Удаляем весь блок сообщения, если это единственное содержимое
            const message = block.closest('.message');
            if (message) {
                // Проверяем, есть ли в сообщении ещё что-то полезное
                const text = message.querySelector('.text');
                const hasText = text && text.textContent.trim().length > 0;
                const hasOtherMedia = message.querySelector('.photo_wrap, .video_file_wrap:not(.media_video)');

                if (!hasText && !hasOtherMedia) {
                    // Если только это видео — удаляем сообщение целиком
                    message.remove();
                } else {
                    // Иначе удаляем только блок видео
                    block.remove();
                }
            }
        }
    });
}

// ===================================================================
// == ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ ==
// ===================================================================
const THEME_KEY = 'telegram-export-theme';

function initThemeSwitcher() {
    // Создаём кнопку
    const switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    switcher.innerHTML = `
        <button class="theme-btn" data-theme="light" title="Светлая тема">☀️</button>
        <button class="theme-btn" data-theme="dark" title="Тёмная тема">🌙</button>
        <button class="theme-btn" data-theme="system" title="Как в системе">💻</button>
    `;
    document.body.appendChild(switcher);

    // Применяем сохранённую тему
    const savedTheme = localStorage.getItem(THEME_KEY) || 'system';
    applyTheme(savedTheme);

    // Обработчики
    switcher.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            localStorage.setItem(THEME_KEY, theme);
            applyTheme(theme);
        });
    });

    // Следим за системной темой
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const current = localStorage.getItem(THEME_KEY) || 'system';
            if (current === 'system') {
                applyTheme('system');
            }
        });
    }
}

function applyTheme(theme) {
    const root = document.documentElement;
    // Удаляем все классы тем
    root.classList.remove('theme-light', 'theme-dark');

    if (theme === 'light') {
        root.classList.add('theme-light');
    } else if (theme === 'dark') {
        root.classList.add('theme-dark');
    } else {
        // system — ничего не добавляем, полагаемся на CSS media query
    }

    // Обновляем активную кнопку
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// ===================================================================
// == ЛОГИКА ТЕМ (ПОДРАЗДЕЛОВ) ==
// ===================================================================

function initTopicTabs() {
    const history = document.querySelector('.history');
    if (!history) return;

    const messageElements = history.querySelectorAll('.message.default, .message.service');
    allMessages = Array.from(messageElements);

    allMessages.forEach(message => {
        const serviceText = message.querySelector('.body.details');
        if (serviceText && serviceText.textContent.includes('created topic')) {
            const match = serviceText.textContent.match(/created topic «(.*)»/);
            if (match && match[1]) {
                const topicName = match[1];
                const topicId = message.id.replace('message', '');
                topics[topicId] = topicName;
            }
        }
    });

    const nav = document.createElement('div');
    nav.className = 'topic-navigation';
    const navContent = document.createElement('div');
    navContent.className = 'topic-nav-content';
    nav.appendChild(navContent);

    const allTab = document.createElement('button');
    allTab.className = 'topic-tab active';
    allTab.textContent = 'Все';
    allTab.dataset.topicId = 'all';
    navContent.appendChild(allTab);

    Object.keys(topics).forEach(topicId => {
        const tab = document.createElement('button');
        tab.className = 'topic-tab';
        tab.textContent = topics[topicId];
        tab.dataset.topicId = topicId;
        navContent.appendChild(tab);
    });

    const pageHeader = document.querySelector('.page_header');
    if (pageHeader) {
        pageHeader.insertAdjacentElement('afterend', nav);
    }

    nav.addEventListener('click', function(e) {
        if (e.target.classList.contains('topic-tab')) {
            const topicId = e.target.dataset.topicId;
            filterMessages(topicId);
            nav.querySelectorAll('.topic-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            collectAllMediaForLightbox();
        }
    });

    history.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#go_to_message"]');
        if (link) {
            const href = link.getAttribute('href');
            const targetMessageId = href.replace('#go_to_message', '');
            const targetMessage = document.getElementById('message' + targetMessageId);
            if (targetMessage) {
                const topicId = getTopicIdForMessage(targetMessage);
                if (topicId) {
                    const tab = nav.querySelector(`.topic-tab[data-topic-id="${topicId}"]`);
                    if (tab && !tab.classList.contains('active')) {
                        filterMessages(topicId);
                        nav.querySelectorAll('.topic-tab').forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        collectAllMediaForLightbox();
                    }
                }
            }
        }
    });

    filterMessages('all');
}

function getTopicIdForMessage(messageElement) {
    // Проверяем сам элемент
    let replyTo = messageElement.querySelector('.reply_to.details a[href^="#go_to_message"]');
    if (replyTo) {
        const topicMessageId = replyTo.getAttribute('href').replace('#go_to_message', '');
        if (topics[topicMessageId]) {
            return topicMessageId;
        }
    }
    // Если это альбом — проверяем сохранённый data-topic
    if (messageElement.dataset && messageElement.dataset.topicId) {
        return messageElement.dataset.topicId;
    }
    return null;
}

function filterMessages(topicId) {
    allMessages.forEach(message => {
        message.style.display = 'none';
    });

    if (topicId === 'all') {
        allMessages.forEach(message => {
            message.style.display = '';
        });
        return;
    }

    allMessages.forEach(message => {
        if (message.classList.contains('service')) {
            message.style.display = '';
            return;
        }
        const messageTopicId = getTopicIdForMessage(message);
        if (messageTopicId === topicId) {
            message.style.display = '';
        }
    });
}

// ===================================================================
// == ГРУППИРОВКА АЛЬБОМОВ (ПЛИТКА) ==
// ===================================================================

function groupAlbums() {
    const history = document.querySelector('.history');
    if (!history) return;

    const messageNodes = Array.from(history.querySelectorAll('.message.default'));

    let i = 0;
    while (i < messageNodes.length) {
        const msg = messageNodes[i];
        const hasPhoto = msg.querySelector('.photo_wrap, .video_file_wrap');

        if (hasPhoto) {
            const albumItems = [];
            let j = i;
            const author = getAuthor(msg);
            const topicId = getTopicIdForMessage(msg);

            while (j < messageNodes.length) {
                const currMsg = messageNodes[j];
                const currAuthor = getAuthor(currMsg);
                const currHasPhoto = currMsg.querySelector('.photo_wrap, .video_file_wrap');

                if (!currHasPhoto || currAuthor !== author || currMsg.dataset.albumGrouped) {
                    break;
                }

                albumItems.push(currMsg);
                currMsg.dataset.albumGrouped = 'true';
                j++;
            }

            if (albumItems.length > 1) {
                const albumContainer = document.createElement('div');
                albumContainer.className = 'album';
                albumContainer.dataset.count = albumItems.length;

                // Собираем все медиа-ссылки ДО очистки firstMsg
                const mediaLinks = albumItems.map(item => item.querySelector('.photo_wrap, .video_file_wrap'));

                const firstMsg = albumItems[0];
                const body = firstMsg.querySelector('.body');

                // Удаляем media_wrap и text из firstMsg (после сбора ссылок)
                const mediaWrapToRemove = body.querySelector('.media_wrap');
                if (mediaWrapToRemove) mediaWrapToRemove.remove();
                const textToRemove = body.querySelector('.text');
                if (textToRemove) textToRemove.remove();

                // Вставляем альбом в body
                body.appendChild(albumContainer);

                // Добавляем плитки
                albumItems.forEach((item, index) => {
                    const mediaLink = mediaLinks[index];
                    if (mediaLink) {
                        const tile = document.createElement('div');
                        tile.className = 'album-item';

                        const clonedLink = mediaLink.cloneNode(true);
                        const img = clonedLink.querySelector('img');
                        if (img) {
                            const fullSrc = clonedLink.getAttribute('href');
                            tile.dataset.fullSrc = fullSrc;
                            tile.dataset.isVideo = clonedLink.classList.contains('video_file_wrap') ? 'true' : 'false';
                        }

                        tile.appendChild(clonedLink);
                        albumContainer.appendChild(tile);

                        // Якорь для навигации (кроме первого сообщения)
                        if (index > 0) {
                            const anchor = document.createElement('div');
                            anchor.id = item.id;
                            anchor.className = 'album-anchor';
                            anchor.style.display = 'none';
                            albumContainer.appendChild(anchor);
                        }

                        // Удаляем остальные сообщения группы
                        if (index > 0) {
                            item.remove();
                        }
                    }
                });

                // Навешиваем обработчики на плитки
                albumContainer.querySelectorAll('.album-item').forEach(tile => {
                    tile.addEventListener('click', handleMediaClick);
                });
            }
            i = j;
        } else {
            i++;
        }
    }
}

function getAuthor(messageElement) {
    const fromName = messageElement.querySelector('.from_name');
    if (fromName) {
        return fromName.textContent.trim();
    }
    const forwardedFrom = messageElement.querySelector('.forwarded .from_name');
    if (forwardedFrom) {
        return forwardedFrom.textContent.trim();
    }
    return '';
}

// ===================================================================
// == СБОР ВСЕХ МЕДИА ДЛЯ ЛАЙТБОКСА ==
// ===================================================================

function collectAllMediaForLightbox() {
    lightboxItems = [];

    const allMediaElements = document.querySelectorAll('.album-item, .photo_wrap, .video_file_wrap');

    allMediaElements.forEach(el => {
        let isVisible = true;

        if (el.classList.contains('album-item')) {
            const msg = el.closest('.message');
            if (msg && msg.style.display === 'none') {
                isVisible = false;
            }
        } else {
            const msg = el.closest('.message');
            if (msg && msg.style.display === 'none') {
                isVisible = false;
            }
        }

        if (isVisible) {
            let fullSrc, isVideo;

            if (el.classList.contains('album-item')) {
                fullSrc = el.dataset.fullSrc;
                isVideo = el.dataset.isVideo === 'true';
            } else {
                fullSrc = el.getAttribute('href');
                isVideo = el.classList.contains('video_file_wrap');
            }

            if (fullSrc) {
                lightboxItems.push({
                    element: el,
                    fullSrc: fullSrc,
                    isVideo: isVideo
                });
            }
        }
    });

    attachLightboxHandlers();
}

function attachLightboxHandlers() {
    document.querySelectorAll('.album-item').forEach(tile => {
        tile.removeEventListener('click', handleMediaClick);
        tile.addEventListener('click', handleMediaClick);
    });

    document.querySelectorAll('.photo_wrap, .video_file_wrap').forEach(link => {
        if (link.closest('.album-item')) return;
        link.removeEventListener('click', handleMediaClick);
        link.addEventListener('click', handleMediaClick);
    });
}

function handleMediaClick(e) {
    e.preventDefault();
    e.stopPropagation();

    let targetEl = e.currentTarget;
    let fullSrc, isVideo;

    if (targetEl.classList.contains('album-item')) {
        fullSrc = targetEl.dataset.fullSrc;
        isVideo = targetEl.dataset.isVideo === 'true';
    } else {
        fullSrc = targetEl.getAttribute('href');
        isVideo = targetEl.classList.contains('video_file_wrap');
    }

    const index = lightboxItems.findIndex(item => item.element === targetEl);

    if (index >= 0) {
        openLightbox(index);
    }
}

// ===================================================================
// == ЛАЙТБОКС ==
// ===================================================================

let lightboxState = {
    currentIndex: 0,
    isOpen: false
};

function initLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-overlay"></div>
        <div class="lightbox-content">
            <button class="lightbox-close" aria-label="Закрыть">&times;</button>
            <button class="lightbox-prev" aria-label="Предыдущее">&#10094;</button>
            <button class="lightbox-next" aria-label="Следующее">&#10095;</button>
            <div class="lightbox-media-container">
                <img class="lightbox-image" src="" alt="">
                <video class="lightbox-video" src="" controls style="display:none;"></video>
            </div>
            <div class="lightbox-counter"></div>
        </div>
    `;
    document.body.appendChild(lightbox);

    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => navigateLightbox(-1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => navigateLightbox(1));

    document.addEventListener('keydown', function(e) {
        if (!lightboxState.isOpen) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    let touchStartX = 0;
    let touchEndX = 0;
    lightbox.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    lightbox.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        const threshold = 50;
        if (touchStartX - touchEndX > threshold) navigateLightbox(1);
        if (touchEndX - touchStartX > threshold) navigateLightbox(-1);
    }
}

function openLightbox(index) {
    if (lightboxItems.length === 0) return;
    lightboxState.currentIndex = index;
    lightboxState.isOpen = true;

    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    updateLightboxContent();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxState.isOpen = false;

    const video = lightbox.querySelector('.lightbox-video');
    video.pause();
    video.src = '';
    video.style.display = 'none';

    const img = lightbox.querySelector('.lightbox-image');
    img.src = '';
    img.style.display = 'block';
}

function navigateLightbox(direction) {
    if (!lightboxState.isOpen || lightboxItems.length <= 1) return;

    lightboxState.currentIndex += direction;
    if (lightboxState.currentIndex < 0) {
        lightboxState.currentIndex = lightboxItems.length - 1;
    }
    if (lightboxState.currentIndex >= lightboxItems.length) {
        lightboxState.currentIndex = 0;
    }

    updateLightboxContent();
}

function updateLightboxContent() {
    const item = lightboxItems[lightboxState.currentIndex];
    if (!item) return;

    const fullSrc = item.fullSrc;
    const isVideo = item.isVideo;

    const lightbox = document.getElementById('lightbox');
    const img = lightbox.querySelector('.lightbox-image');
    const video = lightbox.querySelector('.lightbox-video');
    const counter = lightbox.querySelector('.lightbox-counter');

    video.pause();
    video.src = '';

    if (isVideo) {
        img.style.display = 'none';
        video.style.display = 'block';
        video.src = fullSrc;
        video.play().catch(e => console.log('Автовоспроизведение заблокировано'));
    } else {
        video.style.display = 'none';
        img.style.display = 'block';
        img.src = fullSrc;
    }

    counter.textContent = `${lightboxState.currentIndex + 1} / ${lightboxItems.length}`;

    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    if (lightboxItems.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = '';
        nextBtn.style.display = '';
    }
}

// ===================================================================
// == КОНЕЦ КОДА ==
// ===================================================================
