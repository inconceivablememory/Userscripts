// ==UserScript==
// @name         HQP enhanced
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Enhancements
// @author       inconceivablememory
// @match        https://hqporner.com/hdporn/*.html
// @match        https://hqporner.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/inconceivablememory/Userscripts/master/HQP-enhanced.js
// @updateURL    https://raw.githubusercontent.com/inconceivablememory/Userscripts/master/HQP-enhanced.js
// ==/UserScript==

function redirectToSearchOn404Page() {
	const pageIsMissing = Array.from(document.querySelectorAll("section.box h1"))
		.filter((el) => { return el.textContent == "Why do I see it?" }).length > 0;
	if(pageIsMissing) {
		const matches = (new RegExp("^/hdporn/\\d+-(.+)\\.html$")).exec(location.pathname);
		if(matches.length == 2) {
			const query = matches[1].replaceAll("_", "+");
			window.location.assign(`https://hqporner.com/?q=${query}`);
		}
	}
}

function handleSearchHighlighting() {
	const isSearchPage = window.location.pathname == "/" && window.location.search.includes("q=");
	if(isSearchPage) {
		const searchterm = decodeURIComponent((new RegExp("[\\?&]q=([^&]+)"))
			.exec(window.location.search)[1].replaceAll("+", " "));
		const videoContainers = Array.from(document.querySelectorAll("#main > div.row > div > div > div > section > div > div > div > section"));
		const containersWithMatchingTitles = videoContainers.filter((el) => {
			return el.querySelector(".meta-data-title>a").textContent.toLowerCase() == searchterm.toLowerCase();
		});
		containersWithMatchingTitles.forEach((el) => {
			el.style.border = "10px solid indianred";
		});
	}
}

(function() {
    'use strict';
	redirectToSearchOn404Page();
	handleSearchHighlighting();
})();
