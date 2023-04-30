// ==UserScript==
// @name         PH enhanced
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Multiple enhacements for Pornhub (reposition player, no age confirmation, auto hd, full width)
// @author       inconceivablememory
// @match        https://www.pornhub.com/*
// @grant        GM_addStyle
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/inconceivablememory/Userscripts/master/PH-enhanced.user.js
// @updateURL    https://raw.githubusercontent.com/inconceivablememory/Userscripts/master/PH-enhanced.user.js
// @license      GPL-3.0-or-later; https://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==

function createCookie(name,value,days) {
	let expires = "";
	if (days) {
		const date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		expires = "; expires=" + date.toGMTString();
	}
	document.cookie = `${name}=${value}${expires}; path=/`;
}

function readCookie(name) {
	const nameEQ = name + "=";
	const ca = document.cookie.split(';');
	for(let i=0;i < ca.length;i++) {
		let c = ca[i];
		while (c.charAt(0)==' ') {
			c = c.substring(1,c.length);
		}
		if (c.indexOf(nameEQ) == 0) {
			return c.substring(nameEQ.length,c.length);
		}
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

function removeAgeConfirmation() {
	if(readCookie("accessAgeDisclaimerPH") == null) {
		createCookie("accessAgeDisclaimerPH", "1", 365);
		location.reload();
	}
}

function insertAfter(newNode, existingNode) {
	existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

function repositionPlayer() {
	const headerElement = document.querySelector("header");
	const playerContainer = document.getElementById("player");

	// Sanity check
	if(headerElement == null || playerContainer == null) {
		console.error("Could not move header element!");
		return;
	}

	// Move the header element to be the next sibling of the player container
	insertAfter(headerElement, playerContainer);
}

function autoHD() {
	const playerSettings = JSON.parse(localStorage.mgp_player)
	if(playerSettings != null && playerSettings.quality == null) {
		playerSettings.quality = {
			auto: false, // Disable automatical quality change
			quality: 1080 // Set the quality setting
		};
		playerSettings.autoplay = false; // Disable autoplay
		localStorage.mgp_player = JSON.stringify(playerSettings);
	}
}

(function() {
    'use strict';

	// Remove age confirmation popup
	removeAgeConfirmation();

	// Run only when the page has fully loaded
	document.addEventListener("DOMContentLoaded", () => {
		// Set video player settings automatically
		autoHD();

		// Reposition video player (only if we are on a video page)
		if(window.location.pathname == "/view_video.php") {
			repositionPlayer();
		}
	});
})();
