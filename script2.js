const images = {};
let listSize = 20;
let cIndex = 0 ;

const getLoader = ()=>{
	const loader = document.createElement('h1');
	loader.setAttribute("id","loader");
	loader.innerText = "Loading...";
	return loader;
}

const getImages = (c = 1) => {
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

		Promise.all(new Array(c).fill(0).map(value => fetchImageUrl(dog))).then(async images => {
			let data = await loadImages(images);
			resolve(images);
		});
	});
};

const appendImagesToDOM = images => {
	const container = document.getElementById('container');
	images.map((img, index) => {
		const imageDOM = document.createElement('img');
		imageDOM.setAttribute('src', img);
		imageDOM.setAttribute('id', index + cIndex);
        container.appendChild(imageDOM);

    });
    cIndex = cIndex + images.length;
};

const initIntersectionObserver = () => {
	const options = {
		/* root: document.querySelector("#container") */
	};

	const callback = entries => {
		entries.forEach(async entry => {
			if (entry.target.id === `${listSize - 1}`) {
				const container = document.getElementById('container');
				container.appendChild(getLoader());
                let images = await getImages(20);
				observer.unobserve(document.getElementById(`${listSize - 1}`));
				appendImagesToDOM(images);
				document.getElementById("loader").remove();
                observer.observe(document.getElementById(`${listSize - 1}`));
			}
		});
	};

	observer = new IntersectionObserver(callback, options);
	observer.observe(document.getElementById(`${listSize - 1}`));
};

const loadInitialImages = async () => {
	return new Promise(async (resolve, reject) => {
        let images = await getImages(20);
        appendImagesToDOM(images);
		resolve(images);
	});
};

const start = async () => {
	const container = document.getElementById('container');
	container.appendChild(getLoader());
	await loadInitialImages();
	document.getElementById("loader").remove();
	initIntersectionObserver();
};

start();
