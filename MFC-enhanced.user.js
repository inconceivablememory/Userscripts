// ==UserScript==
// @name         MFC enhanced
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  MFC enhanced
// @match        https://www.myfreecams.com/
// @match        https://www.myfreecams.com/#Homepage
// @grant        GM_openInTab
// ==/UserScript==

function stopEventPropagation(ev) {
	ev.preventDefault();
	ev.stopImmediatePropagation();
}

function modelClickHandler() {
	document.querySelector("#tiny_header_mfc_img").addEventListener("click", (ev) => {
		stopEventPropagation(ev);
		GM_openInTab("https://www.myfreecams.com/#homepage");
	});

	document.querySelectorAll("div.model_online").forEach((modelContainer) => {
		const avatarContainer = modelContainer.querySelector(".avatar");

		// Overwrite the default mouse listeners so we can later attach our own click handler
		avatarContainer.addEventListener("mousedown", stopEventPropagation);
		avatarContainer.addEventListener("mouseup", stopEventPropagation);

		// Attach our own click handler to open the model in a new tab
		avatarContainer.addEventListener("click", (ev) => {
			const titleElement = modelContainer.querySelector(".model_title");
			const modelName = titleElement.textContent.trim();
			const userId = avatarContainer.getAttribute("data-uid");

			//const fullViewUrl = `https://www.myfreecams.com/_html/pm.html?user_id=${userId}&load_video=1&full_video=1&username=${modelName}`;
			const fullViewUrl = `https://www.myfreecams.com/#${modelName}`;

			console.log(modelName, fullViewUrl);
			GM_openInTab(fullViewUrl);
		});
	});
}

(function() {
    'use strict';
    setTimeout(modelClickHandler, 2000);
})();
