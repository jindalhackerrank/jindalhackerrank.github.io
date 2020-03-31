const images = {};
const domCache = {};

let topSentinelPreviousY = 0;
let topSentinelPreviousRatio = 0;
let bottomSentinelPreviousY = 0;
let bottomSentinelPreviousRatio = 0;

let listSize = 40;
let DBSize = 1000000;

let DB = [];

let currentIndex = 0;

const initList = async num => {
	const container = document.getElementById('container');

	for (let i = 0; i < num; i++) {
		const tile = document.createElement('LI');
		tile.setAttribute('class', 'image-block-cntnr');
		tile.setAttribute('id', 'image-block-' + i);
        const title = document.createElement('H3');
        title.setAttribute("class","title");
		const t = document.createTextNode(`Loading...${i}`);
		title.appendChild(t);
		tile.appendChild(title);
		container.appendChild(tile);
		getImages().then(dom => {
            tile.appendChild(dom);
            domCache[i] = dom;
        });
	}
};

const getSlidingWindow = isScrollDown => {
	const increment = listSize / 2;
	let firstIndex;

	if (isScrollDown) {
		firstIndex = currentIndex + increment;
	} else {
		firstIndex = currentIndex - increment;
	}

	if (firstIndex < 0) {
		firstIndex = 0;
	}

	return firstIndex;
};

const recycleDOM = firstIndex => {
	for (let i = 0; i < listSize; i++) {
		const tileCntnt = document.querySelector('#image-block-' + i);
		if (domCache[i+firstIndex]) {
            let elem = document.querySelector(`#image-block-${i} .image-block`);
            if(elem) {
                elem.remove();
                
            }
            document.querySelector(`#image-block-${i} .title`).innerHTML = `Loading... ${i+firstIndex}`;
			document.querySelector(`#image-block-${i}`).appendChild(domCache[i+firstIndex]);
		} else {
            let elem = document.querySelector(`#image-block-${i} .image-block`);
            if(elem) {
                elem.remove();
               
            }
            document.querySelector(`#image-block-${i} .title`).innerHTML = `Loading... ${i+firstIndex}`;
			getImages().then(dom => {
                domCache[i+firstIndex] = dom;
				document.querySelector(`#image-block-${i}`).appendChild(dom);
			});
		}
	}
};

const getNumFromStyle = numStr => Number(numStr.substring(0, numStr.length - 2));

const adjustPaddings = isScrollDown => {
	const container = document.querySelector('#container');
	const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
	const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
	const remPaddingsVal = document.getElementById('image-block-20').offsetTop - currentPaddingTop;
	if (isScrollDown) {
		container.style.paddingTop = currentPaddingTop + remPaddingsVal + 'px';
		container.style.paddingBottom =
			currentPaddingBottom === 0 ? '0px' : currentPaddingBottom - remPaddingsVal + 'px';
	} else {
		container.style.paddingBottom = currentPaddingBottom + remPaddingsVal + 'px';
		container.style.paddingTop = currentPaddingTop === 0 ? '0px' : currentPaddingTop - remPaddingsVal + 'px';
	}
};

const topSentCallback = entry => {
	if (currentIndex === 0) {
		const container = document.querySelector('#container');
		container.style.paddingTop = '0px';
		container.style.paddingBottom = '0px';
	}

	const currentY = entry.boundingClientRect.top;
	const currentRatio = entry.intersectionRatio;
	const isIntersecting = entry.isIntersecting;

	// conditional check for Scrolling up
	if (
		currentY > topSentinelPreviousY &&
		isIntersecting &&
		currentRatio >= topSentinelPreviousRatio &&
		currentIndex !== 0
	) {
		const firstIndex = getSlidingWindow(false);
		adjustPaddings(false);
		recycleDOM(firstIndex);
		currentIndex = firstIndex;
	}

	topSentinelPreviousY = currentY;
	topSentinelPreviousRatio = currentRatio;
};

const botSentCallback = entry => {
	if (currentIndex === DBSize - listSize) {
		return;
	}
	const currentY = entry.boundingClientRect.top;
	const currentRatio = entry.intersectionRatio;
	const isIntersecting = entry.isIntersecting;

	// conditional check for Scrolling down
	if (currentY < bottomSentinelPreviousY && currentRatio > bottomSentinelPreviousRatio && isIntersecting) {
		const firstIndex = getSlidingWindow(true);
		adjustPaddings(true);
		recycleDOM(firstIndex);
		currentIndex = firstIndex;
	}

	bottomSentinelPreviousY = currentY;
	bottomSentinelPreviousRatio = currentRatio;
};

const initIntersectionObserver = () => {
	const options = {
		/* root: document.querySelector("#container") */
	};

	const callback = entries => {
		entries.forEach(entry => {
			if (entry.target.id === 'image-block-0') {
				topSentCallback(entry);
			} else if (entry.target.id === `image-block-${listSize - 1}`) {
				botSentCallback(entry);
			}
		});
	};

	var observer = new IntersectionObserver(callback, options);
	observer.observe(document.querySelector('#image-block-0'));
	observer.observe(document.querySelector(`#image-block-${listSize - 1}`));
};

const getImages = () => {
	let dog = `https://random.dog/woof.json`;
	const container = document.getElementById('container');
	return new Promise((resolve, reject) => {
		let count = 0;
		let fetchImageUrl = async imageUrl => {
			return new Promise(async (resolve, reject) => {
				try {
					let url;
					let data = await fetch(imageUrl);
					data = await data.json();
					url = data.image || data.url;
					if (images[url] || url.search('.jpg') === -1) url = await fetchImageUrl(imageUrl);
					else {
						url = data.image || data.url;
						images[url] = 1;
					}
					resolve(url);
				} catch {
					reject('error');
				}
			});
		};

		let loadImages = async images => {
			return new Promise(async (resolve, reject) => {
				let data = {};
				let counter = 0;
				try {
					images.map(value => {
						var newImg = new Image();
						newImg.src = value;
						newImg.onload = function() {
							counter++;
							data[this.src] = {
								height: this.height,
								width: this.width,
								aspect: this.width / this.height,
							};
							if (counter === images.length) resolve(data);
						};
					});
				} catch {
					reject('error');
				}
			});
		};

		Promise.all(new Array(5).fill(0).map(value => fetchImageUrl(dog))).then(async images => {
			let data = await loadImages(images);
			let elems = Object.keys(data).reduce((acc, value) => [...acc, data[value]], []);
			let x = fixed_partition(elems, {
				align: 'center',
				containerWidth: window.innerWidth,
				idealElementHeight: 300,
				spacing: 2,
			});
			const tile = document.createElement('div');
			tile.setAttribute('class', 'image-block');
			tile.style.width = `${x.width}px`;
			tile.style.height = `${x.height}px`;
			x.positions.map((value, index) => {
				const img = document.createElement('img');
				img.style.position = 'absolute';
				img.style.width = `${value.width}px`;
				img.style.left = `${value.x}px`;
				img.style.top = `${value.y}px`;
				img.style.height = `${value.height}px`;
				img.src = Object.keys(data)[index];
				tile.appendChild(img);
			});
			container.appendChild(tile);
            resolve(tile);
		});
	});
};

const start = () => {
	initList(40);
	initIntersectionObserver();
};

start();


