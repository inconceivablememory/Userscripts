// ==UserScript==
// @name         P.trex enhanced
// @namespace    http://tampermonkey.net/
// @author       inconceivablememory
// @version      0.2
// @description  Add quality and views filter for video page
// @match        https://www.porntrex.com/categories/*
// @match        https://www.porntrex.com/search/*
// @match        https://www.porntrex.com/tags/*
// @match        https://www.porntrex.com/models/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @downloadURL  https://raw.githubusercontent.com/inconceivablememory/Userscripts/master/P.trex-enhanced.js
// @updateURL    https://raw.githubusercontent.com/inconceivablememory/Userscripts/master/P.trex-enhanced.js
// ==/UserScript==

function createElementFromHtml(sourceHtml) {
	const placeholder = document.createElement("div");
	placeholder.innerHTML = sourceHtml;
	return placeholder.firstChild;
}

function filterVideos() {
	const videoEntriesContainer = document.querySelector(".porntrex-box .video-list");
	const videoEntries = videoEntriesContainer.querySelectorAll(".video-item");

	for(const videoEntry of videoEntries) {
		const qualityInfo = videoEntry.querySelector(".quality");
		const qualityResolution = parseInt(/([0-9]+)p/.exec(qualityInfo.textContent)[1]);
		const minQuality = GM_getValue("minquality");

		const viewsInfo = videoEntry.querySelector(".viewsthumb");
		const viewsNumber = parseInt(/([0-9 ]+) views/.exec(viewsInfo.textContent)[1].replace(" ", ""));
		const minViews = GM_getValue("minviews");

		const hideVideo = (minQuality != null && qualityResolution < minQuality) || (minViews != null && viewsNumber < minViews);
		videoEntry.style.display = hideVideo ? "none" : "inherit";
	}
}

function addQualitySelector() {
	const sortSettingsContainer = document.querySelector(".sort-holder ul");
	const selectorHtml = `<div class="sort" id="qualitySettingSelectorContainer"><span class="icon type-sort"></span><strong>Quality</strong><ul class="list-unstyled"><li><a>All</a></li><li><a data-quality="720">720p+</a></li><li><a data-quality="1080">1080p+</a></li><li><a data-quality="1440">1440p+</a></li><li><a data-quality="2160">2160p+</a></li></ul></div>`;
	sortSettingsContainer.appendChild(createElementFromHtml(selectorHtml));

	for(const element of document.querySelectorAll("#qualitySettingSelectorContainer a")) {
		element.addEventListener("click", (ev) => {
			ev.preventDefault();
			const dataQualityAttribute = element.getAttribute("data-quality");
			const minQuality = dataQualityAttribute != null ? parseInt(dataQualityAttribute) : null;
			console.log(`Setting minimum quality as ${minQuality}p`);
			GM_setValue("minquality", minQuality);
			filterVideos();
		});
	}
}

function addViewsSelector() {
	const sortSettingsContainer = document.querySelector(".sort-holder ul");
	const selectorHtml = `<div class="sort"><strong>Views</strong><div><input id="viewsSettingSlider" type="range" min="0" max="1000"><span id="viewsSettingSliderDisplay"></span></div></div>`;
	sortSettingsContainer.appendChild(createElementFromHtml(selectorHtml));

	const viewsSettingSlider = document.getElementById("viewsSettingSlider");
	const viewsSettingSliderDisplay = document.getElementById("viewsSettingSliderDisplay");

	function logScale(minViews) {
		const minp = parseInt(viewsSettingSlider.min); // 0
		const maxp = parseInt(viewsSettingSlider.max); // 1000
		const minv = Math.log(1); // Lowest views possible (it has to be 1 because log(0) is undefined)
		const maxv = Math.log(100000); // Highest views possible
		const scale = (maxv - minv) / (maxp - minp);
		return Math.round(Math.exp(minv + scale * (minViews - minp))) - 1;
	}

	// Triggered when slider is moved
	viewsSettingSlider.addEventListener("input", (ev) => {
		const minViewsScaled = logScale(parseInt(viewsSettingSlider.value));
		viewsSettingSliderDisplay.innerHTML = minViewsScaled;
	});

	// Triggered when slider is moved and let go again
	viewsSettingSlider.addEventListener("change", (ev) => {
		const minViewsScaled = logScale(parseInt(viewsSettingSlider.value));
		console.log(`Setting minimum view count as ${minViewsScaled}`);
		GM_setValue("minviews", minViewsScaled);
		filterVideos();
	});
}

function addMutationObserver() {
	/* Because of the dynamimic loading behavior of the site we have to use a mutation observer to handle it
	the dynamic loading replaces the whole videoEntriesContainer as well as our custom sorting selectors
	so we have have filter the videos and add the selectors again. */
	const observer = new MutationObserver((mutationList, observer) => {
		addQualitySelector();
		addViewsSelector();
		filterVideos();
	});
	observer.observe(document.querySelector(".main-container"), {attributes: false, childList: true, subtree: false});
}

/* Because tampermonkey does not support the fetch api, we have to use XMLHttpRequest, this is a wrapper for it utilizing
promises (found on stackoverflow) */
function makeRequest(method, url) {
	return new Promise(function(resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.onload = function() {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(xhr.response);
			} else {
				reject({
					status: xhr.status,
					statusText: xhr.statusText
				});
			}
		};
		xhr.onerror = function() {
			reject({
				status: xhr.status,
				statusText: xhr.statusText
			});
		};
		xhr.send();
	});
}

async function appendPage(pageUrl) {
	console.log("Loading page", pageUrl);
	const newHtmlSource = await makeRequest("GET", pageUrl);
	const newHtmlElement = createElementFromHtml(newHtmlSource);
	const newVideoEntries = newHtmlElement.querySelector(".video-list").childNodes;

	// Append the new video entries
	const placeholder = document.createDocumentFragment();
	for(const el of newVideoEntries) {
		// We have to attach handler to make the previews work (I adapted this code from the porntrex source code)
		$(el).find('.screenshots-list .screenshot-item').on({
			'mouseover': function () {
				$(el).find('.screenshots-list .screenshot-item').removeClass('active');
				$(this).addClass('active');
				var new_src = $(this).data('src');
				var path = $(this).closest('a');
				path.find('img').attr('src', new_src);
			},
			'mouseout': function () {
				$(el).find('.screenshots-list .screenshot-item').removeClass('active');
				$(el).find('.screenshots-list .screenshot-item:first-of-type').addClass('active');
				var path = $(this).closest('a');
				var fist_src = path.find('.screenshot-item:first-of-type').data('src');
				path.find('img').attr('src', fist_src);
			}
    	});

		placeholder.appendChild(el)
	}

	document.querySelector(".video-list").appendChild(placeholder);
}

async function loadNextPage() {
	// Get current pagenumber
	const currentPagenumberElement = document.querySelector(".page-current span")
	const currentPagenumber = parseInt(currentPagenumberElement.textContent);
	const nextPagenumberPadded = String(currentPagenumber + 1).padStart(2, '0');

	const nextPagenumber = parseInt(document.querySelector(".pagination li.next").textContent);

	// Retrieve the new content
	let newPageUrl = null;
	if(window.location.pathname.startsWith("/categories/") || window.location.pathname.startsWith("/tags/")) {
		newPageUrl = window.location.origin + window.location.pathname + `?mode=async&function=get_block&block_id=list_videos_common_videos_list_norm&from4=${nextPagenumberPadded}&_=${Date.now()}`;
	} else if(window.location.pathname.startsWith("/search/")) {
		// Get checked category ids and search query
		const categoryIds = Array.from(document.querySelectorAll("#list_categories_sidebar_categories_filter_items input:checked")).map(el => el.value);
		const query = document.querySelector("#search_form input").value;

		newPageUrl = window.location.origin + window.location.pathname + `?mode=async&function=get_block&block_id=list_videos_videos&q=${query}&category_ids]${categoryIds.join(",")}&from=${nextPagenumberPadded}&_=${Date.now()}`;
	} else if(window.location.pathname.startsWith("/tags/")) {
		// todo
	}

	if(newPageUrl != null) {
		// Append page
		try {
			await appendPage(newPageUrl);

			// Increase pagenumber
			currentPagenumberElement.textContent = currentPagenumber + 1;

			// Trigger video filterung
			filterVideos();

			return true;
		} catch(e) {
			console.error(e);
			window.removeEventListener("scroll", loadNextPage);
			return false;
		}
	}
}

// If we have filtered out to much, automatically load a new pages until we have enough videos
async function fillVideosContainer() {
	console.log("Filling videos container");

	// Function that returns the amount of videos currently not hidden by any filters
	const amountOfVisibleVideos = () => {
		return Array.from(document.querySelector(".video-list").children).filter((el) => el.style.display != "none").length
	};

	let pageLoadSuccessfull = true;
	let counter = 0; // Use a counter as a failsafe to avoid infinite loading loop
	const failsafeMaxCounter = 25;
	const minVisibleVideos = 50;

	while(amountOfVisibleVideos() < minVisibleVideos && pageLoadSuccessfull) {
		counter += 1;
		pageLoadSuccessfull = await loadNextPage();

		if(counter >= failsafeMaxCounter) {
			console.error(`FillVideosContainer: Failsafe activated, exceeded the maximum of ${failsafeMaxCounter} requests`);
			return false;
		}
	}

	return true;
}

function addInfiniteScrollHandling() {
	// Hide pagination footer
	//GM_addStyle(".pagination { display: none; }");
	//document.body.appendChild(createElementFromHtml("<div id='infinite-scroll-enabled' data-enabled='true'></div>"));

	let infiniteScrollEnabled = true; // Used to disable loading new pages while a page is currently loading
	const videoList = document.querySelector(".video-list");

	const scrollHandler = async (ev) => {
		//const scrolledPastVideoList = (videoList.offsetTop + videoList.clientHeight) < window.scrollY * 0.95;
		const videoListBottomVisible = () => { return (videoList.offsetTop + videoList.clientHeight) < (window.innerHeight + window.scrollY) * 0.95 };
		const bottomOfPageReached = () => { return window.scrollMaxY * 0.9 < window.scrollY };
		let counter = 0;
		while(infiniteScrollEnabled && (bottomOfPageReached() || videoListBottomVisible()) && counter < 15) {
			infiniteScrollEnabled = false;
			await loadNextPage();
			infiniteScrollEnabled = true;
			counter += 1;
		}
	}

	window.addEventListener("scroll", scrollHandler);
	scrollHandler();
}

function autoDarkmode() {
	const lightThemeButton = document.querySelector(".dropdown.theme-color li.w-style");
	const darkThemeButton = document.querySelector(".dropdown.theme-color li.b-style");
	darkThemeButton.click();
}

(function() {
    'use strict';
	//autoDarkmode();
	addQualitySelector();
	addViewsSelector();
	addMutationObserver();
	filterVideos();
	addInfiniteScrollHandling();
	//fillVideosContainer()
})();
