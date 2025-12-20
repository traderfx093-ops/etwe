// ==UserScript==
// @name         QX NILOY V1.8.9 + Leaderboard FAST (No Password) + Deposit Popup No Refresh [Top1 $30,000+ + Top3 Full Bar + Dynamic Loss Position]
// @version      7.8.15-nopass
// @description  Top1: $30,000.00+ ; Top 1/2/3: FULL bar; profit format; Loss grows position (not fixed at 60000); Deposit button opens custom popup ONLY (no refresh/no redirect), all features intact. Cancel closes just the popup. NO PASSWORD REQUIRED.
// @author       QX + Copilot Update
// @match        *://market-qx.trade/*
// @grant        none
// ==/UserScript==

(function () {
'use strict';

// --- QX NILOY V1.8.9 (market-qx.trade-fixed) ---

if (location.href === "https://market-qx.trade/en/trade") {
    location.replace("https://market-qx.trade/en/demo-trade");
    return;
}

if (location.href === "https://market-qx.trade/en/demo-trade") {
    const fakeUrl = "https://market-qx.trade/en/trade";
    const fakeTitle = "Live trading | Quotex";
    document.title = fakeTitle;
    new MutationObserver(() => {
        if (document.title !== fakeTitle) document.title = fakeTitle;
    }).observe(document.querySelector('title'), { childList: true });
    history.replaceState(null, "", fakeUrl);
}
const now = Date.now();
const pwKey = atob("c2x0ZWNoX3ZlcmlmaWVkX2luZm8=");
const balKey = atob("aW5pdGlhbEJhbGFuY2VJbmZv");
const lbKey = atob("c2x0ZWNoX2xlYWRlcmJvYXJkX2RhdGE=");
const demoBalKey = "sltechbd_demo_balance";

// --- UPDATED SELECTORS FOR NEW DOM ---
const selectors = {
    positionHeaderMoney: ".---react-features-Sidepanel-LeaderBoard-Position-styles-module__money--BwWCZ",
    usermenuBalance: ".---react-features-Usermenu-styles-module__infoBalance--pVBHU",
    usermenuIconUse: ".---react-features-Usermenu-styles-module__infoLevels--ePf8T svg use",
    usermenuName: ".---react-features-Usermenu-styles-module__infoName--SfrTV.---react-features-Usermenu-styles-module__demo--TmWTp",
    levelName: ".---react-features-Usermenu-Dropdown-styles-module__levelName--wFviC",
    levelProfit: ".---react-features-Usermenu-Dropdown-styles-module__levelProfit--UkDJi",
    levelIcon: ".---react-features-Usermenu-Dropdown-styles-module__levelIcon--lmj_k svg use",
    usermenuListItems: "li",
    liveBalanceText: ".---react-features-Usermenu-styles-module__infoText--58LeE .---react-features-Usermenu-styles-module__infoBalance--pVBHU",
    // New Leaderboard Selectors
    leaderboardContainer: ".---react-features-Sidepanel-LeaderBoard-styles-module__items--LTZTE",
    leaderboardItem: ".---react-features-Sidepanel-LeaderBoard-styles-module__item--8FRDh",
    yourPositionHeader: ".---react-features-Sidepanel-LeaderBoard-Position-styles-module__header--DTYNe",
    yourPositionFooter: ".---react-features-Sidepanel-LeaderBoard-Position-styles-module__footer--iKtL6",
    loadingBar: ".---react-features-Sidepanel-LeaderBoard-Position-styles-module__expand--KBHoM"
};

const activeClass = '---react-features-Usermenu-Dropdown-styles-module__active--P5n2A';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const numFromText = s => s ? parseFloat(s.replace(/[^0-9.]/g, "")) : NaN;

function formatWithThousands(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatProfitDisplay(diff) {
    const val = formatWithThousands(Math.abs(diff));
    if (diff < 0) {
        return `-$${val}`;
    } else {
        return `$${val}`;
    }
}

let initialBal = 0;
const savedBal = localStorage.getItem(balKey);
if (savedBal) {
    const d = JSON.parse(savedBal);
    if (now - d.timestamp < 864e5) initialBal = parseFloat(d.balance);
}

// Demo balance logic
let demoBalance = 10000;
const savedDemoBal = localStorage.getItem(demoBalKey);
if (savedDemoBal) {
    const d = JSON.parse(savedDemoBal);
    if (now - d.timestamp < 864e5) demoBalance = parseFloat(d.balance);
}

function formatAmount(num) { return "$" + num.toFixed(2); }

function spoofUI() {
    const listItems = $$(selectors.usermenuListItems);
    if (!listItems.length) return;
    const demoLi = listItems.find(li => li.innerText.includes("Demo Account"));
    const liveLi = listItems.find(li => li.innerText.includes("Live"));
    if (!demoLi || !liveLi) return;
    const demoBalanceElem = demoLi.querySelector("b");
    const liveBalanceElem = liveLi.querySelector("b");
    if (!demoBalanceElem || !liveBalanceElem) return;

    // Use demoBalance from localStorage
    const fixedDemoAmountStr = formatAmount(demoBalance);
    const liveBalanceFromUI = $(selectors.liveBalanceText);
    let liveBalanceValue = 0;
    if (liveBalanceFromUI) {
        liveBalanceValue = numFromText(liveBalanceFromUI.textContent);
        if (isNaN(liveBalanceValue)) liveBalanceValue = 0;
    }
    const liveAmountStr = formatAmount(liveBalanceValue);

    demoBalanceElem.textContent = fixedDemoAmountStr;
    liveBalanceElem.textContent = liveAmountStr;
    if (demoLi.classList.contains(activeClass)) demoLi.classList.remove(activeClass);
    if (!liveLi.classList.contains(activeClass)) liveLi.classList.add(activeClass);
}

let lastProfitDiff = null;
let currentExpandPercent = parseInt(localStorage.getItem('expandPercent')) || 0;

function updatePositionExpandOnProfitChange(forceFullBar = false) {
    const bal = numFromText($(selectors.usermenuBalance)?.textContent);
    if (isNaN(bal)) return;
    const diff = bal - initialBal;
    if (diff !== lastProfitDiff) {
        currentExpandPercent = Math.floor(Math.random() * 91) + 10;
        lastProfitDiff = diff;
        localStorage.setItem('expandPercent', currentExpandPercent);

        const expandSpan = $(selectors.loadingBar);
        if (expandSpan) expandSpan.style.width = (forceFullBar ? '100%' : (currentExpandPercent + "%"));

        const slider = document.getElementById('capitalPercentSlider');
        if (slider) {
            slider.value = currentExpandPercent;
            updatePercentDisplay(currentExpandPercent);
        }
    } else {
        const expandSpan = $(selectors.loadingBar);
        if (expandSpan) expandSpan.style.width = (forceFullBar ? '100%' : (currentExpandPercent + "%"));

        const slider = document.getElementById('capitalPercentSlider');
        if (slider) {
            updatePercentDisplay(currentExpandPercent);
        }
    }
}

function updatePercentDisplay(value) {
    let display = document.getElementById("sliderPercentDisplay");
    if (!display) return;
    display.textContent = value + "%";
}

// ----- Leaderboard Section Integration -----

const leaderboardSelector = selectors.leaderboardContainer;
const leaderboardRowSelector = selectors.leaderboardItem;
const yourHeaderSelector = selectors.yourPositionHeader;
const yourFooterSelector = selectors.yourPositionFooter;

let currentRowIndex = null;
const originalRows = {};

// ==== Points for interpolation (keep as before) ====
const points = [
    { profit: -10000, position: 60000 },
    { profit: 0, position: 58471 },
    { profit: 1, position: 3154 },
    { profit: 7886, position: 21 },
    { profit: 20000, position: 1 }
];

function parseMoney(text) {
    return parseFloat(text.replace(/[^0-9.-]+/g, '')) || 0;
}

function getYourData() {
    const header = document.querySelector(yourHeaderSelector);
    if (!header) return null;

    const nameEl = header.querySelector('.---react-features-Sidepanel-LeaderBoard-Position-styles-module__name--xN5cX');
    const name = nameEl?.textContent.trim() ?? '';

    const moneyEl = header.querySelector('.---react-features-Sidepanel-LeaderBoard-Position-styles-module__money--BwWCZ');
    const profitText = moneyEl?.textContent.trim() ?? '';
    const profit = parseMoney(profitText);

    const isRed = moneyEl?.classList.contains('---react-features-Sidepanel-LeaderBoard-Position-styles-module__red--LD4pW') || profit < 0;
    
    if (!moneyEl) {
        return {
            name,
            profit: 0,
            profitText: profitText || '$0.00',
            flagCode: 'ca'
        };
    }

    const flagSvg = nameEl.querySelector('svg');
    const flagClass = flagSvg?.getAttribute('class') || '';
    const flagUse = flagSvg?.querySelector('use')?.getAttribute('xlink:href') || '';
    const flagCode = flagClass.replace('flag-', '') || (flagUse.includes('#flag-') ? flagUse.split('#flag-')[1] : '');

    return { name, profit, profitText, flagCode };
}

function updateFooter(positionNum) {
    const footer = document.querySelector(yourFooterSelector);
    if (footer) {
        footer.innerHTML = `<div class="---react-features-Sidepanel-LeaderBoard-Position-styles-module__title--ocuJC">Your position:</div>${positionNum}`;
    }
}

function restoreOldRow(index) {
    const row = document.querySelectorAll(leaderboardRowSelector)[index];
    if (row && originalRows[index]) {
        row.innerHTML = originalRows[index];
    }
}

// ==== পরিবর্তন করা হলো: বড় লস হলে extrapolation ====
function calculateInterpolatedPosition(profit) {
    const sortedPoints = points.slice().sort((a, b) => a.profit - b.profit);

    // For profit below the lowest point ("big loss"), extrapolate linearly
    if (profit <= sortedPoints[0].profit) {
        const p0 = sortedPoints[0];
        const p1 = sortedPoints[1];
        const m = (p1.position - p0.position) / (p1.profit - p0.profit);
        const pos = m * (profit - p0.profit) + p0.position;
        return Math.max(1, Math.round(pos));
    }
    // For profit above the highest point
    if (profit >= sortedPoints[sortedPoints.length - 1].profit) {
        return sortedPoints[sortedPoints.length - 1].position;
    }
    // Interval interpolation (as before)
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1 = sortedPoints[i];
        const p2 = sortedPoints[i + 1];
        if (profit >= p1.profit && profit <= p2.profit) {
            const m = (p2.position - p1.position) / (p2.profit - p1.profit);
            const pos = m * (profit - p1.profit) + p1.position;
            return Math.max(1, Math.round(pos));
        }
    }
    return Math.max(1, sortedPoints[0].position); // fallback
}

function updateLinearPosition(profit) {
    const footer = document.querySelector(yourFooterSelector);
    if (!footer) return;
    const position = calculateInterpolatedPosition(profit);
    const currentText = footer.innerText.replace(/\D/g, '');
    const newText = position.toString();
    if (currentText !== newText) {
        footer.innerHTML = `<div class="---react-features-Sidepanel-LeaderBoard-Position-styles-module__title--ocuJC">Your position:</div>${newText}`;
        localStorage.setItem('lastPositionNumber', newText);
    }
}

function applySavedPosition() {
    const saved = localStorage.getItem('lastPositionNumber');
    const footer = document.querySelector(yourFooterSelector);
    if (saved && footer) {
        footer.innerHTML = `<div class="---react-features-Sidepanel-LeaderBoard-Position-styles-module__title--ocuJC">Your position:</div>${saved}`;
    }
}

let lastTopPosition = null;

function updateLeaderboard(user) {
    const leaderboard = document.querySelector(leaderboardSelector);
    if (!leaderboard) return;
    const rows = Array.from(leaderboard.querySelectorAll(leaderboardRowSelector));
    if (!rows.length) return;
    
    const yourIndex = rows.findIndex(row => {
        const moneyEl = row.querySelector('.---react-features-Sidepanel-LeaderBoard-styles-module__money--jJUGd');
        return moneyEl && parseMoney(moneyEl.textContent) <= user.profit;
    });
    const targetIndex = yourIndex === -1 ? rows.length - 1 : yourIndex;
    
    if (targetIndex !== currentRowIndex) {
        if (currentRowIndex !== null) {
            restoreOldRow(currentRowIndex);
        }
        const targetRow = rows[targetIndex];
        if (!targetRow) return;
        if (!originalRows[targetIndex]) {
            originalRows[targetIndex] = targetRow.innerHTML;
        }
        // Update flag
        const flagSVG = targetRow.querySelector('svg.flag');
        const flagUSE = flagSVG?.querySelector('use');
        if (flagSVG && flagUSE && user.flagCode) {
            flagSVG.setAttribute('class', `flag flag-${user.flagCode}`);
            flagUSE.setAttribute('xlink:href', `/profile/images/flags.svg#flag-${user.flagCode}`);
        }
        // Force default avatar
        const avatarDiv = targetRow.querySelector('.---react-features-Sidepanel-LeaderBoard-styles-module__avatar--ZVpcN');
        if (avatarDiv) {
            avatarDiv.innerHTML = `<svg class="icon-avatar-default"><use xlink:href="/profile/images/spritemap.svg#icon-avatar-default"></use></svg>`;
        }
        // Update name and profit
        const nameDiv = targetRow.querySelector('.---react-features-Sidepanel-LeaderBoard-styles-module__name--MrPOZ');
        if (nameDiv) {
            nameDiv.textContent = user.name;
        }
        const moneyDiv = targetRow.querySelector('.---react-features-Sidepanel-LeaderBoard-styles-module__money--jJUGd');
        if (moneyDiv) {
            if (targetIndex === 0) {
                moneyDiv.textContent = "$30,000.00+";
            } else {
                moneyDiv.textContent = formatProfitDisplay(user.profit);
            }
            moneyDiv.style.color = user.profit < 0 ? "#fd4d3c" : "#0faf59";
        }
        currentRowIndex = targetIndex;
        updateFooter(targetIndex + 1);

        lastTopPosition = (targetIndex >= 0 && targetIndex <= 2) ? (targetIndex + 1) : null;
    }
}

function checkAndUpdateLeaderboard() {
    const user = getYourData();
    if (!user) {
        if (currentRowIndex !== null) {
            restoreOldRow(currentRowIndex);
            currentRowIndex = null;
        }
        updateFooter(calculateInterpolatedPosition(0));
        lastTopPosition = null;
        return;
    }
    const leaderboard = document.querySelector(leaderboardSelector);
    if (!leaderboard) return;
    const rows = Array.from(leaderboard.querySelectorAll(leaderboardRowSelector));
    if (rows.length < 5) return; // Adjusted for smaller initial loads
    
    const lastRow = rows[rows.length - 1];
    const lastProfit = parseMoney(lastRow.querySelector('.---react-features-Sidepanel-LeaderBoard-styles-module__money--jJUGd')?.textContent || '0');

    if (user.profit >= lastProfit) {
        updateLeaderboard(user);
    } else {
        if (currentRowIndex !== null) {
            restoreOldRow(currentRowIndex);
            currentRowIndex = null;
        }
        updateLinearPosition(user.profit);
        lastTopPosition = null;
    }
}

function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

function updateUI() {
    const bal = numFromText($(selectors.usermenuBalance)?.textContent);
    const profitEl = $(selectors.positionHeaderMoney);
    const levelIconUse = $(selectors.usermenuIconUse);
    const levelIconDropdown = $(selectors.levelIcon);

    if (!isNaN(bal) && profitEl) {
        const diff = bal - initialBal;
        profitEl.innerText = formatProfitDisplay(diff);
        // Update color class for new DOM
        if (diff < 0) {
            profitEl.classList.add('---react-features-Sidepanel-LeaderBoard-Position-styles-module__red--LD4pW');
            profitEl.classList.remove('---react-features-Sidepanel-LeaderBoard-Position-styles-module__green--LD4pW');
            profitEl.style.color = "#fd4d3c";
        } else {
            profitEl.classList.add('---react-features-Sidepanel-LeaderBoard-Position-styles-module__green--LD4pW');
            profitEl.classList.remove('---react-features-Sidepanel-LeaderBoard-Position-styles-module__red--LD4pW');
            profitEl.style.color = "#0faf59";
        }
    }
    let levelType = 'standart';
    if (bal > 9999.99) levelType = 'vip';
    else if (bal > 4999.99) levelType = 'pro';
    const iconHref = `/profile/images/spritemap.svg#icon-profile-level-${levelType}`;
    if (levelIconUse) levelIconUse.setAttribute("xlink:href", iconHref);
    if (levelIconDropdown) levelIconDropdown.setAttribute("xlink:href", iconHref);

    const nameEl = $(selectors.usermenuName);
    if (nameEl) {
        nameEl.textContent = isMobile() ? "Live" : "Live Account";
        nameEl.style.color = "#0faf59";
    }
    
    const levelNameElem = $(selectors.levelName);
    const levelProfitElem = $(selectors.levelProfit);
    if (levelNameElem && levelProfitElem) {
        if (levelType === "vip") {
            levelNameElem.textContent = "vip:";
            levelProfitElem.textContent = "+4% profit";
        } else if (levelType === "pro") {
            levelNameElem.textContent = "pro:";
            levelProfitElem.textContent = "+2% profit";
        } else {
            levelNameElem.textContent = "standard:";
            levelProfitElem.textContent = "+0% profit";
        }
    }
    
    const lbData = localStorage.getItem(lbKey);
    if (lbData) {
        const { name, flag } = JSON.parse(lbData);
        const nameBox = document.querySelector(".---react-features-Sidepanel-LeaderBoard-Position-styles-module__name--xN5cX");
        if (nameBox && name && flag) {
            nameBox.innerHTML = `<svg class="flag-${flag}"><use xlink:href="/profile/images/flags.svg#flag-${flag}"></use></svg> ${name}`;
        }
    }

    let forceFullBar = lastTopPosition && [1,2,3].includes(lastTopPosition);
    updatePositionExpandOnProfitChange(forceFullBar);

    checkAndUpdateLeaderboard();
}

// ---- UI update triggers ----

let timeoutId = null;
function debouncedUpdate() {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        spoofUI();
        updateUI();
    }, 50);
}

new MutationObserver(debouncedUpdate).observe(document.body, { childList: true, subtree: true });

if (document.readyState === "complete" || document.readyState === "interactive") {
    spoofUI();
    applySavedPosition();
    updateUI();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        spoofUI();
        applySavedPosition();
        updateUI();
    });
}

// --- Deposit Button → Popup Trigger ---
function showDepositPopup() {
    if ($('#capitalBalancePopup')) return;
    const popup = document.createElement("div");
    popup.id = "capitalBalancePopup";
    popup.innerHTML = `
<div style="font-weight:bold; font-size:22px; margin-bottom:12px; color:#0faf59; text-align:center; border-radius:10px;">
    👑414 TRADER BD<br>
    <a id="telegramLink" href="https://t.me/onlysell919" target="_blank" style="font-size:14px; color:#fd4d3c; text-decoration:underline; cursor:pointer;">BY @onlysell919</a>
</div>
<label style="display:block; margin-bottom:6px;">
    👤 Leaderboard Name:
</label>
<input type="text" id="leaderboardNameInput" class="sl-input" value="414 TRADER" placeholder="@onlysell919" />
<label style="display:block; margin:12px 0 6px;">
    🚩 Leaderboard Flag Code:
</label>
<input type="text" id="leaderboardFlagInput" class="sl-input" placeholder="e.g. bd" />
<label style="display:block; margin:12px 0 6px;">
    🏆 Leaderboard Amount Show:
</label>
<input type="number" id="leaderboardInput" class="sl-input" placeholder="Enter leaderboard amount" />
<label style="display:block; margin:12px 0 6px;">
    Demo Account Balance:
</label>
<input type="number" id="demoBalanceInput" class="sl-input" placeholder="Enter demo balance" value="${demoBalance}" min="0" />

<label style="display:block; margin:12px 0 6px;">
    Capital % Slider:
</label>
<div style="position: relative; width: 100%; margin-bottom: 6px;">
<input type="range" id="capitalPercentSlider" class="sl-input" min="0" max="100" step="1" value="0" style="width: 100%;" />
<div id="sliderPercentDisplay" style="
position: absolute;
top: -22px;
right: 10px;
font-weight: bold;
color: #222;
background: #eee;
padding: 2px 8px;
border-radius: 6px;
user-select: none;
pointer-events: none;
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
font-size: 16px;
box-shadow:0 2px 10px #2222;
">0%</div>
</div>

<div style="text-align:center; margin-top:22px;">
<button id="setCapitalBtn" class="sl-button" style="background:#fdc500; color:#222;">Set</button>
<button id="cancelCapitalBtn" class="sl-button sl-cancel" style="background:#888;">Cancel</button>
</div>
`;
    Object.assign(popup.style, {
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        background: "#fff", color: "#222",
        padding: window.innerWidth < 600 ? "5vw" : "28px", borderRadius: "20px", boxShadow: "0 16px 44px rgba(0,0,0,0.23)",
        zIndex: "10000", width: window.innerWidth < 600 ? "98vw" : "380px", maxWidth: "99vw", fontFamily: "'Segoe UI', sans-serif"
    });
    const style = document.createElement("style");
    style.textContent = `
.sl-input {
    width: 100%; padding: 13px; margin-bottom: 10px; border: 1.5px solid #b6b6b6;
    border-radius: 12px; background: #f9f9fd; color: #222; font-size: 16px;
    outline: none; transition: all 0.3s;
    box-shadow:0 2px 10px #ececec;
}
.sl-input:focus {
    border-color: #1976d2;
    box-shadow: 0 0 7px rgba(25, 118, 210, 0.4);
}
.sl-button {
    padding: 10px 24px; margin: 0 7px; background: #0077cc; border: none;
    border-radius: 10px; color: #fff; font-weight: bold; font-size: 16px; cursor: pointer;
    transition: background 0.3s, box-shadow 0.3s;
    box-shadow:0 2px 10px #ececec;
}
.sl-button:hover { background: #005fa3; }
.sl-button.sl-cancel { background: #888; }
.sl-button.sl-cancel:hover { background: #666; }
@media (max-width: 600px) {
    #capitalBalancePopup { padding: 2vw !important; width: 98vw !important; }
    .sl-input, .sl-button { font-size: 18px !important; }
}
`;
    document.head.appendChild(style);
    document.body.appendChild(popup);

    const slider = $('#capitalPercentSlider');
    const expandSpan = $(selectors.loadingBar);
    slider.oninput = () => {
        if (expandSpan) expandSpan.style.width = slider.value + "%";
        updatePercentDisplay(slider.value);
    };

    $('#setCapitalBtn').onclick = () => {
        const lb = parseFloat($('#leaderboardInput').value);
        const name = $('#leaderboardNameInput').value.trim();
        const flag = $('#leaderboardFlagInput').value.trim().toLowerCase();
        const ub = numFromText($(selectors.usermenuBalance)?.textContent);

        if (!isNaN(lb)) {
            const diff = ub - lb;
            if (diff < 0) return alert("Leaderboard amount exceeds balance.");
            initialBal = diff;
        } else return alert("Enter valid amount.");

        localStorage.setItem(balKey, JSON.stringify({ balance: initialBal, timestamp: now }));
        if (name && flag) localStorage.setItem(lbKey, JSON.stringify({ name, flag }));

        const demoVal = parseFloat($('#demoBalanceInput').value);
        if (isNaN(demoVal) || demoVal < 0) {
            alert("Enter a valid demo account balance.");
            return;
        }
        demoBalance = demoVal;
        localStorage.setItem(demoBalKey, JSON.stringify({ balance: demoBalance, timestamp: Date.now() }));
        spoofUI();
        updateUI();

        popup.remove();
    };
    $('#cancelCapitalBtn').onclick = () => popup.remove();
}

function hijackDepositBtn() {
    const allBtns = document.querySelectorAll('a,button');
    allBtns.forEach(btn => {
        if (btn._qxDepositPopup) return;
        if (
            (btn.href && btn.href.includes("/deposit")) ||
            (btn.textContent && btn.textContent.trim().toLowerCase() === "deposit")
        ) {
            btn._qxDepositPopup = true;
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showDepositPopup();
                return false;
            }, true);
        }
    });
}
new MutationObserver(hijackDepositBtn).observe(document.body, { childList: true, subtree: true });
if (document.readyState === "complete" || document.readyState === "interactive") {
    hijackDepositBtn();
} else {
    document.addEventListener('DOMContentLoaded', hijackDepositBtn);
}

})();

// licang 
// License overlay (non-destructive) -> Verify -> remove overlay (no page replace)
// Paste into DevTools Console or include as a JS file on the page.
(function SafeLicenseOverlay() {
  'use strict';

  // ----- UPDATE/KEEP your Firebase config here -----
  const FIREBASE_SCRIPTS = [
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
  ];
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSy8m3iuH0de6K31q58DlDcm4RFsJfNTt0Y",
    authDomain: "xsiam-8cd91.firebaseapp.com",
    projectId: "xsiam-8cd91",
    storageBucket: "xsiam-8cd91.appspot.com",
    messagingSenderId: "449795686178",
    appId: "1:449795686178:web:67631b23b88be6a0eaef7b",
  };
  // encoded keys used previously
  const STORAGE_KEYS = {
    device: atob('ZGV2aWNlSWQ='),          // 'deviceId'
    license: atob('dmVyaWZpZWRMaWNlbnNl'), // 'verifiedLicense'
    licenseId: atob('dmVyaWZpZWRMaWNlbnNlSWQ=') // 'verifiedLicenseId'
  };

  const OVERLAY_ID = 'safe-license-overlay-v1';
  const STYLE_ID = 'safe-license-styles-v1';

  // load script once helper
  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return setTimeout(resolve, 30);
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => setTimeout(resolve, 40);
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  // inject css only once
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
      #${OVERLAY_ID} {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      #${OVERLAY_ID} .panel {
        width: 100%;
        max-width: 680px;
        background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        padding: 48px 40px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
        font-family: 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        flex-direction: column;
        gap: 28px;
        align-items: stretch;
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      #${OVERLAY_ID} .header-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        text-align: center;
        margin-bottom: 12px;
        padding-bottom: 24px;
        border-bottom: 2px solid #e2e8f0;
      }
      #${OVERLAY_ID} .title {
        font-size: 36px;
        font-weight: 800;
        color: #1e293b;
        margin: 0;
        letter-spacing: -0.8px;
        text-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
        line-height: 1.2;
        position: relative;
        display: inline-block;
      }
      #${OVERLAY_ID} .title::before {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 4px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 2px;
      }
      #${OVERLAY_ID} .hint {
        font-size: 17px;
        color: #475569;
        margin: 0;
        font-weight: 500;
        line-height: 1.6;
        margin-top: 4px;
      }
      #${OVERLAY_ID} .input-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-top: 12px;
      }
      #${OVERLAY_ID} .row {
        display: flex;
        gap: 16px;
        align-items: stretch;
        flex-direction: column;
      }
      #${OVERLAY_ID} input[type="text"] {
        width: 100%;
        padding: 20px 24px;
        border-radius: 16px;
        border: 2.5px solid #e2e8f0;
        font-size: 18px;
        font-weight: 500;
        outline: none;
        background: #ffffff;
        color: #0f172a;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      #${OVERLAY_ID} input[type="text"]:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12), 0 4px 12px rgba(99, 102, 241, 0.15);
        transform: translateY(-1px);
      }
      #${OVERLAY_ID} input[type="text"]::placeholder {
        color: #94a3b8;
        font-weight: 400;
      }
      #${OVERLAY_ID} button.verify {
        width: 100%;
        padding: 20px 32px;
        border-radius: 16px;
        border: none;
        cursor: pointer;
        color: white;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        font-weight: 700;
        font-size: 18px;
        letter-spacing: 0.3px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35), 0 0 0 0 rgba(99, 102, 241, 0.5);
        position: relative;
        overflow: hidden;
      }
      #${OVERLAY_ID} button.verify::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      #${OVERLAY_ID} button.verify:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(99, 102, 241, 0.4), 0 0 0 0 rgba(99, 102, 241, 0.5);
      }
      #${OVERLAY_ID} button.verify:hover::before {
        left: 100%;
      }
      #${OVERLAY_ID} button.verify:active {
        transform: translateY(0);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }
      #${OVERLAY_ID} button.verify:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }
      #${OVERLAY_ID} .msg {
        display: none;
        padding: 16px 20px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.5;
        animation: slideDown 0.3s ease-out;
      }
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #${OVERLAY_ID} .msg.show { display: block; }
      #${OVERLAY_ID} .msg.error {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #991b1b;
        border: 2px solid #fca5a5;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
      }
      #${OVERLAY_ID} .msg.success {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        color: #065f46;
        border: 2px solid #6ee7b7;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
      }
      @keyframes fadeOutUp {
        to { opacity: 0; transform: translateY(-20px) scale(0.96); }
      }
      @media (max-width: 768px) {
        #${OVERLAY_ID} .panel {
          margin: 20px;
          width: calc(100% - 40px);
          padding: 36px 28px;
          max-width: 100%;
        }
        #${OVERLAY_ID} .header-section {
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        #${OVERLAY_ID} .title {
          font-size: 28px;
          font-weight: 800;
        }
        #${OVERLAY_ID} .title::before {
          width: 50px;
          height: 3px;
        }
        #${OVERLAY_ID} .hint {
          font-size: 15px;
        }
        #${OVERLAY_ID} input[type="text"] {
          padding: 18px 20px;
          font-size: 16px;
        }
        #${OVERLAY_ID} button.verify {
          padding: 18px 28px;
          font-size: 16px;
        }
      }
      @media (max-width: 480px) {
        #${OVERLAY_ID} .panel {
          margin: 16px;
          width: calc(100% - 32px);
          padding: 32px 24px;
          gap: 24px;
        }
        #${OVERLAY_ID} .header-section {
          padding-bottom: 18px;
          margin-bottom: 18px;
          gap: 10px;
        }
        #${OVERLAY_ID} .title {
          font-size: 26px;
          font-weight: 800;
        }
        #${OVERLAY_ID} .title::before {
          width: 45px;
          height: 3px;
        }
        #${OVERLAY_ID} .hint {
          font-size: 14px;
        }
        #${OVERLAY_ID} input[type="text"] {
          padding: 16px 18px;
          font-size: 15px;
        }
        #${OVERLAY_ID} button.verify {
          padding: 16px 24px;
          font-size: 15px;
        }
      }
    `;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // create overlay & UI
  function createOverlay() {
    // if overlay exists, return it
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) return existing;

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="header-section">
        <div class="title">License Verification</div>
        <div class="hint">Enter your license key to activate and continue</div>
      </div>
      <div class="input-section">
        <div class="row">
          <input type="text" id="${OVERLAY_ID}-input" placeholder="Enter your license key here..." autocomplete="off" />
          <button class="verify" id="${OVERLAY_ID}-btn">Verify License</button>
        </div>
        <div id="${OVERLAY_ID}-msg" class="msg" aria-live="polite"></div>
      </div>
    `;
    overlay.appendChild(panel);

    document.body.appendChild(overlay);
    return overlay;
  }

  // utility: show message in overlay
  function showMessage(msgEl, text, type='error', duration=4500) {
    if (!msgEl) return;
    msgEl.className = 'msg show ' + (type === 'success' ? 'success' : 'error');
    msgEl.textContent = text;
    if (duration > 0) {
      setTimeout(() => {
        if (msgEl) msgEl.className = 'msg';
      }, duration);
    }
  }

  // device id generator (best-effort)
  function hashString(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return (h >>> 0).toString(36);
  }
  function generateDeviceId() {
    let f = '';
    try {
      const c = document.createElement('canvas');
      c.width = 200; c.height = 40;
      const ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('dv' + Math.random().toString(36).slice(2, 8), 2, 2);
      f += c.toDataURL();
    } catch (e) {
      f += 'canvas-err-' + Math.random();
    }
    try {
      f += navigator.userAgent || '';
      f += navigator.language || '';
      f += navigator.platform || '';
      f += screen.width + 'x' + screen.height;
    } catch (e) {
      f += 'nav-err';
    }
    return hashString(f) + '-' + Date.now().toString(36).slice(-6);
  }
  function getDeviceId() {
    try {
      let id = localStorage.getItem(STORAGE_KEYS.device);
      if (!id || typeof id !== 'string' || id.length < 8) {
        id = generateDeviceId();
        try {
          localStorage.setItem(STORAGE_KEYS.device, id);
        } catch (e) {
          sessionStorage.setItem(STORAGE_KEYS.device, id);
        }
      }
      return id;
    } catch (e) {
      try {
        let s = sessionStorage.getItem(STORAGE_KEYS.device);
        if (!s) { s = generateDeviceId(); sessionStorage.setItem(STORAGE_KEYS.device, s); }
        return s;
      } catch (err) {
        return 'dev-' + Math.random().toString(36).slice(2, 9);
      }
    }
  }

  // remove overlay with animation, then detach
  function animateAndRemoveOverlay(overlayEl) {
    return new Promise(resolve => {
      if (!overlayEl) return resolve();
      const panel = overlayEl.querySelector('.panel');
      if (panel) {
        panel.style.transition = 'opacity 260ms ease, transform 260ms ease';
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-10px) scale(0.995)';
        setTimeout(() => {
          if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
          resolve();
        }, 300);
      } else {
        if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
        resolve();
      }
    });
  }

  // init firebase compat and return firestore instance
  async function initFirebase() {
    try {
      // load scripts serially
      for (const s of FIREBASE_SCRIPTS) await loadScriptOnce(s);
      if (!window.firebase) throw new Error('Firebase failed to load');
      if (!window.firebase.apps || !window.firebase.apps.length) {
        window.firebase.initializeApp(FIREBASE_CONFIG);
      }
      const db = window.firebase.firestore();
      return db;
    } catch (e) {
      throw e;
    }
  }

  // verify license in firestore, register device if needed, persist locally
  async function verifyLicense(db, licenseKey) {
    if (!db) throw new Error('Firestore not available');
    const key = (licenseKey || '').trim();
    if (!key) return { ok: false, msg: 'Please enter a license key' };
    try {
      const q = await db.collection('licenses').where('licenseKey', '==', key).limit(1).get();
      if (q.empty) return { ok: false, msg: 'Invalid license key' };
      const doc = q.docs[0];
      const data = doc.data();
      const id = doc.id;

      if (data.status === 'Blocked') return { ok: false, msg: 'This license is blocked' };

      const devices = Array.isArray(data.devices) ? data.devices.slice() : [];
      const unique = [...new Set(devices)];
      const deviceLimit = parseInt(data.deviceLimit) || 0;

      const deviceId = getDeviceId();
      const isRegistered = unique.includes(deviceId);

      if (!isRegistered) {
        if (deviceLimit > 0 && unique.length >= deviceLimit) {
          return { ok: false, msg: `Device limit reached. Max ${deviceLimit}` };
        }
        devices.push(deviceId);
        const afterUnique = [...new Set(devices)];
        // update Firestore
        await db.collection('licenses').doc(id).update({
          devices: devices,
          activeDevices: afterUnique.length
        });
      }

      // persist locally
      try {
        localStorage.setItem(STORAGE_KEYS.license, key);
        localStorage.setItem(STORAGE_KEYS.licenseId, id);
      } catch (e) {
        sessionStorage.setItem(STORAGE_KEYS.license, key);
        sessionStorage.setItem(STORAGE_KEYS.licenseId, id);
      }

      return { ok: true, licenseKey: key, licenseId: id, deviceRegistered: true };
    } catch (err) {
      console.error('verifyLicense error', err);
      return { ok: false, msg: 'Error verifying license' };
    }
  }

  // main runner: inject overlay, wire events, handle successful removal
  async function run() {
    try {
      injectStyles();
      const overlay = createOverlay();
      const input = overlay.querySelector(`#${OVERLAY_ID}-input`);
      const btn = overlay.querySelector(`#${OVERLAY_ID}-btn`);
      const msgEl = overlay.querySelector(`#${OVERLAY_ID}-msg`);

      // If already verified locally -> remove overlay immediately (no blocking)
      try {
        const existing = localStorage.getItem(STORAGE_KEYS.license) || sessionStorage.getItem(STORAGE_KEYS.license);
        if (existing) {
          // small delay so overlay renders then disappears (non-destructive)
          setTimeout(() => animateAndRemoveOverlay(overlay), 150);
          return;
        }
      } catch (e) {
        // continue if storage lookup fails
      }

      // Enter key triggers verify
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          btn.click();
        }
      });

      btn.addEventListener('click', async () => {
        btn.disabled = true;
        showMessage(msgEl, 'Verifying license...', 'success', 3000);

        const key = (input.value || '').trim();
        if (!key) {
          showMessage(msgEl, 'Please enter a license key', 'error', 3000);
          input.focus();
          btn.disabled = false;
          return;
        }

        let db;
        try {
          db = await initFirebase();
        } catch (e) {
          console.error('Firebase init failed', e);
          showMessage(msgEl, 'Verification backend failed to load', 'error', 5000);
          btn.disabled = false;
          return;
        }

        try {
          const res = await verifyLicense(db, key);
          if (!res.ok) {
            showMessage(msgEl, res.msg || 'Invalid license', 'error', 5000);
            btn.disabled = false;
            return;
          }
          // success: remove overlay and leave page intact
          showMessage(msgEl, 'License verified — applying...', 'success', 900);
          await new Promise(r => setTimeout(r, 700)); // brief UX pause
          await animateAndRemoveOverlay(overlay);
          // done: overlay removed, website stays active
        } catch (err) {
          console.error(err);
          showMessage(msgEl, 'Error verifying license. Try again.', 'error', 5000);
          btn.disabled = false;
        }
      });

    } catch (err) {
      console.error('License overlay error', err);
      // don't block the page; if overlay failed, just log
    }
  }

  // Start
  run();

})();