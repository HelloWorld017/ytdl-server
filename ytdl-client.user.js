// ==UserScript==
// @name         Youtube Downloader
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Download videos on youtube
// @author       Khinenw
// @include      http://www.youtube.com/*
// @include      https://www.youtube.com/*
// @include      http://youtube.com/*
// @include      https://youtube.com/*
// @exclude      http://www.youtube.com/embed/*
// @exclude      https://www.youtube.com/embed/*
// @exclude      http://youtube.com/embed/*
// @exclude      https://youtube.com/embed/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';
	//const YTDL_SERVER_URL = `http://khinenw.azurewebsites.net/server.js?key=PASSWORD_HERE&v=`;
	const YTDL_SERVER_URL = `http://localhost:1337/?key=nenwnenw&v=`;

	class Icons {
		static get download() {
			return `<path d="M10 10.5q0-0.203-0.148-0.352t-0.352-0.148-0.352 0.148-0.148 0.352 0.148 0.352 0.352 0.148 0.352-0.148 0.148-0.352zM12 10.5q0-0.203-0.148-0.352t-0.352-0.148-0.352 0.148-0.148 0.352 0.148 0.352 0.352 0.148 0.352-0.148 0.148-0.352zM13 8.75v2.5q0 0.312-0.219 0.531t-0.531 0.219h-11.5q-0.312 0-0.531-0.219t-0.219-0.531v-2.5q0-0.312 0.219-0.531t0.531-0.219h3.633l1.055 1.062q0.453 0.438 1.062 0.438t1.062-0.438l1.062-1.062h3.625q0.312 0 0.531 0.219t0.219 0.531zM10.461 4.305q0.133 0.32-0.109 0.547l-3.5 3.5q-0.141 0.148-0.352 0.148t-0.352-0.148l-3.5-3.5q-0.242-0.227-0.109-0.547 0.133-0.305 0.461-0.305h2v-3.5q0-0.203 0.148-0.352t0.352-0.148h2q0.203 0 0.352 0.148t0.148 0.352v3.5h2q0.328 0 0.461 0.305z"></path>`;
		}

		static get music() {
			return `<path d="M11.469 2.969q0.219 0.219 0.375 0.594t0.156 0.688v9q0 0.312-0.219 0.531t-0.531 0.219h-10.5q-0.312 0-0.531-0.219t-0.219-0.531v-12.5q0-0.312 0.219-0.531t0.531-0.219h7q0.312 0 0.688 0.156t0.594 0.375zM8 1.062v2.937h2.937q-0.078-0.227-0.172-0.32l-2.445-2.445q-0.094-0.094-0.32-0.172zM11 13v-8h-3.25q-0.312 0-0.531-0.219t-0.219-0.531v-3.25h-6v12h10zM4.844 6.641q0.156 0.062 0.156 0.234v4.25q0 0.172-0.156 0.234-0.062 0.016-0.094 0.016-0.094 0-0.18-0.070l-1.297-1.305h-1.023q-0.109 0-0.18-0.070t-0.070-0.18v-1.5q0-0.109 0.070-0.18t0.18-0.070h1.023l1.297-1.305q0.125-0.117 0.273-0.055zM8.102 12.023q0.242 0 0.391-0.187 1.008-1.242 1.008-2.836t-1.008-2.836q-0.125-0.164-0.336-0.187t-0.367 0.109q-0.164 0.133-0.184 0.34t0.113 0.371q0.781 0.961 0.781 2.203t-0.781 2.203q-0.133 0.164-0.113 0.371t0.184 0.332q0.141 0.117 0.312 0.117zM6.453 10.867q0.211 0 0.367-0.156 0.68-0.727 0.68-1.711t-0.68-1.711q-0.141-0.148-0.352-0.156t-0.359 0.133-0.156 0.348 0.141 0.363q0.406 0.445 0.406 1.023t-0.406 1.023q-0.148 0.156-0.141 0.363t0.156 0.348q0.156 0.133 0.344 0.133z"></path>`;
		}

		static get video() {
			return `<path d="M11.469 2.969q0.219 0.219 0.375 0.594t0.156 0.688v9q0 0.312-0.219 0.531t-0.531 0.219h-10.5q-0.312 0-0.531-0.219t-0.219-0.531v-12.5q0-0.312 0.219-0.531t0.531-0.219h7q0.312 0 0.688 0.156t0.594 0.375zM8 1.062v2.937h2.937q-0.078-0.227-0.172-0.32l-2.445-2.445q-0.094-0.094-0.32-0.172zM11 13v-8h-3.25q-0.312 0-0.531-0.219t-0.219-0.531v-3.25h-6v12h10zM6 6q0.406 0 0.703 0.297t0.297 0.703v3q0 0.406-0.297 0.703t-0.703 0.297h-3q-0.406 0-0.703-0.297t-0.297-0.703v-3q0-0.406 0.297-0.703t0.703-0.297h3zM9.844 6.016q0.156 0.062 0.156 0.234v4.5q0 0.172-0.156 0.234-0.062 0.016-0.094 0.016-0.109 0-0.18-0.070l-2.070-2.078v-0.703l2.070-2.078q0.070-0.070 0.18-0.070 0.031 0 0.094 0.016z"></path>`;
		}

		static svg(icon) {
			return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="12" height="14" viewBox="0 0 12 14">
				${Icons[icon]}
			</svg>`;
		}
	}

	const findAndInject = () => {
		console.log("Injecting...");
		const $ = document.querySelector.bind(document);

		let parent = $('#menu-container #top-level-buttons');

		if(!parent) {
			setTimeout(findAndInject, 2000);
			return;
		}

		const readyParent = () => {
			parent.querySelectorAll('ytd-toggle-button-renderer').forEach((v) => v.style.whiteSpace = 'nowrap');
		};

		const openInNewTab = (url) => {
			const a = document.createElement('a');
			a.href = url;
			a.target = "_blank";
			a.click();
		};

		const getVideoId = () => {
			return location.href.match(/v=([a-zA-Z0-9-_]+)/)[1];
		};

		const applyStyle = (elem, style) => {
			Object.keys(style).forEach(key => {
				elem.style[key] = style[key];
			});
		};

		const createButton = (width, svg, text) => {
			const renderer = document.createElement('div');

			const button = document.createElement('button');
			button.innerHTML = `${Icons.svg(svg)}${text}`;
			renderer.appendChild(button);

			const pathElem = button.querySelector('path');
			const svgElem = button.querySelector('svg');

			applyStyle(renderer, {
				color: 'var(--yt-icon-color, rgba(17, 17, 17, .4))',

				display: 'flex',
    			alignItems: 'flex-start',
    			justifyContent: 'center',
				whiteSpace: 'nowrap',
				overflow: 'hidden',
				transition: 'all .4s ease'
			});

			applyStyle(button, {
				background: 'transparent',
				border: 'none',
				outline: 'none',
				cursor: 'pointer',

				display: 'flex',
				alignItems: 'center'
			});

			applyStyle(pathElem, {
				transition: 'all .4s ease',
				fill: 'var(--yt-icon-color, rgba(17, 17, 17, .4))'
			});

			applyStyle(svgElem, {
				height: 'var(--yt-button-icon-size, 36px)',
				marginRight: '3px'
			});

			renderer.addEventListener('mouseover', () => {
				renderer.querySelector('path').style.fill = 'var(--yt-hovered-text-color, rgba(17, 17, 17, .8))';
                renderer.style.color = 'var(--yt-hovered-text-color, rgba(17, 17, 17, .8))';
			});

			renderer.addEventListener('mouseout', () => {
				renderer.querySelector('path').style.fill = 'var(--yt-icon-color, rgba(17, 17, 17, .4))';
                renderer.style.color = 'var(--yt-icon-color, rgba(17, 17, 17, .4))';
			});

			renderer.showButton = () => {
				renderer.style.width = width;
			};

			renderer.hideButton = () => {
				renderer.style.width = '0';
			};

			renderer.inject = () => {
				parent.appendChild(renderer);
			};

			renderer.inject();

			return renderer;
		};

		const videoButton = createButton('5rem', 'video', 'mp4');
		videoButton.hideButton();
		videoButton.addEventListener('click', () => {
			openInNewTab(`${YTDL_SERVER_URL}${getVideoId()}`);
			return;
		});

		const musicButton = createButton('5rem', 'music', 'mp3');
		musicButton.hideButton();
		musicButton.addEventListener('click', () => {
			openInNewTab(`${YTDL_SERVER_URL}${getVideoId()}&type=music`);
			return;
		});

		const downloadButton = createButton('10rem', 'download', '다운로드');
		downloadButton.id = 'dlbutton';
		downloadButton.hideButton();
		downloadButton.addEventListener('click', () => {
			downloadButton.hideButton();
			videoButton.showButton();
			musicButton.showButton();
		});

		const checkInject = () => {
			const _parent = $('#menu-container #top-level-buttons');
			if(!_parent || _parent.querySelector('#dlbutton')) {
				setTimeout(checkInject, 2000);
				return;
			}

			parent = _parent;

			readyParent();

			downloadButton.inject();
			downloadButton.hideButton();
			setTimeout(() => downloadButton.showButton(), 1000);
			videoButton.inject();
			videoButton.hideButton();
			musicButton.inject();
			musicButton.hideButton();

			setTimeout(checkInject, 2000);
		};

		checkInject();

		setTimeout(() => downloadButton.showButton(), 1000);
	};

	findAndInject();
})();
